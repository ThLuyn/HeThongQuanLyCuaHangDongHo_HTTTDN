// @ts-nocheck
import { AlertCircleIcon, CheckCircle2Icon, Clock3Icon, HistoryIcon, LogInIcon, LogOutIcon, MapPinIcon, RefreshCcwIcon, SaveIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { loadAuthSession } from '../utils/authStorage'
import {
  checkInAttendanceApi,
  checkOutAttendanceApi,
  getEmployeesApi,
  getMyAttendanceStatusApi,
  getShiftAssignmentsApi,
  saveShiftAssignmentsApi,
} from '../utils/backendApi'

function formatDateVN(dateStr: string) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  if (!y || !m || !d) return dateStr
  return `${d}/${m}/${y}`
}

function getVietnamTodayString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function getDelayUntilNextVietnamMidnight() {
  const nowText = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })
  const vnNow = new Date(nowText)
  const nextMidnight = new Date(vnNow)
  nextMidnight.setHours(24, 0, 2, 0)
  return Math.max(1000, nextMidnight.getTime() - vnNow.getTime())
}

export function DailyAttendance({ viewMode = 'auto' }) {
  const currentSession = loadAuthSession()
  const currentRole = String(currentSession?.role || '').toLowerCase()
  const isAdminOrHr = ['admin', 'hr'].includes(currentRole)
  const isStaffMode = viewMode === 'self' || (viewMode !== 'manage' && currentRole === 'staff')
  const [tab, setTab] = useState<'attendance' | 'shift'>('attendance')

  // ── Modal ──────────────────────────────────────────────────────────────────
  const [modal, setModal] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const showModal = (type: 'success' | 'error', message: string) => setModal({ type, message })
  const closeModal = () => setModal(null)

  // ── GPS ────────────────────────────────────────────────────────────────────
  const STORES = [
    { name: '273 An Dương Vương, Phường Chợ Quán, TP. Hồ Chí Minh', lat: 10.759421130525608, lng: 106.6824379075026 },
    { name: '35A Tân Trang, Phường Tân Hòa, TP. Hồ Chí Minh', lat: 10.7788976, lng: 106.6547478 },
    { name: '13C Khu Bờ Hàng, Phường Phú Định, TP. Hồ Chí Minh', lat: 10.713926, lng: 106.622889 },
    { name: '78/9 An Dương Vương, Phường An Đông, TP. Hồ Chí Minh', lat: 10.757314, lng: 106.670805 },
  ]
  const STORE_RADIUS_METERS = 100
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'checking' | 'ok' | 'far' | 'denied' | 'error'>('idle')
  const [gpsDistance, setGpsDistance] = useState<number | null>(null)
  const [nearestStore, setNearestStore] = useState<string | null>(null)

  function calcDistanceMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const checkGPS = (): Promise<boolean> => {
    return new Promise((resolve) => {
      setGpsStatus('checking')
      if (!navigator.geolocation) { setGpsStatus('error'); resolve(false); return }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          let minDist = Infinity
          let closestStore = STORES[0]
          for (const store of STORES) {
            const d = calcDistanceMeters(latitude, longitude, store.lat, store.lng)
            if (d < minDist) { minDist = d; closestStore = store }
          }
          const dist = Math.round(minDist)
          setGpsDistance(dist)
          setNearestStore(closestStore.name)
          if (dist <= STORE_RADIUS_METERS) { setGpsStatus('ok'); resolve(true) }
          else { setGpsStatus('far'); resolve(false) }
        },
        (err) => { setGpsStatus(err.code === 1 ? 'denied' : 'error'); resolve(false) },
        { enableHighAccuracy: true, timeout: 10000 },
      )
    })
  }

  // ── Staff state ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(getVietnamTodayString())
  const [attendanceDate, setAttendanceDate] = useState('')
  const [myAttendance, setMyAttendance] = useState({ hasShift: false, canCheckIn: false, canCheckOut: false, shifts: [] })

  // ── Admin / manage state ───────────────────────────────────────────────────
  // Dùng shiftData (từ getShiftAssignments) làm nguồn duy nhất cho bảng chấm công
  const [shiftLoading, setShiftLoading] = useState(true)
  const [shiftSaving, setShiftSaving] = useState(false)
  const [shiftDate, setShiftDate] = useState(getVietnamTodayString())
  const [shiftEmployees, setShiftEmployees] = useState([])      // danh sách NV (từ getEmployees)
  const [shiftDefinitions, setShiftDefinitions] = useState([])  // danh sách ca
  // assignment map: mnv -> shiftId[] (dùng cho tab Phân ca)
  const [shiftAssignmentsByEmployee, setShiftAssignmentsByEmployee] = useState({})
  // attendance rows: mỗi phần tử có mnv, fullName, positionName, shiftIds[]
  const [attendanceRows, setAttendanceRows] = useState([])
  // checkIn/checkOut by shift: Record<mnv, Record<shiftId, { checkIn, checkOut }>>
  const [checkInOutByShift, setCheckInOutByShift] = useState({})
  // Pagination
  const [currentAttendancePage, setCurrentAttendancePage] = useState(0)
  const [currentShiftPage, setCurrentShiftPage] = useState(0)
  const pageSize = 5
  // Search
  const [searchAttendance, setSearchAttendance] = useState('')
  const [searchShift, setSearchShift] = useState('')
  // Track local changes ở tab Phân ca để không bị reset khi polling
  const [hasLocalShiftChanges, setHasLocalShiftChanges] = useState(false)

  // Ref để polling luôn đọc date mới nhất mà không cần re-create interval
  const selectedDateRef = useRef(selectedDate)
  const shiftDateRef = useRef(shiftDate)
  const hasLocalShiftChangesRef = useRef(false)
  useEffect(() => { selectedDateRef.current = selectedDate }, [selectedDate])
  useEffect(() => { shiftDateRef.current = shiftDate }, [shiftDate])
  useEffect(() => { hasLocalShiftChangesRef.current = hasLocalShiftChanges }, [hasLocalShiftChanges])

  // ── Load functions ─────────────────────────────────────────────────────────

  // Load dữ liệu cho STAFF (chấm công cá nhân)
  const loadMyAttendance = async (dateOverride?: string, opts?: { silent?: boolean }) => {
    const date = dateOverride || getVietnamTodayString() 
    if (!opts?.silent) { setLoading(true); setError('') }
    try {
      const data = await getMyAttendanceStatusApi(date)
      const responseDate = String(data?.date || '').slice(0, 10)
      setMyAttendance({
        hasShift: Boolean(data?.hasShift),
        canCheckIn: Boolean(data?.canCheckIn),
        canCheckOut: Boolean(data?.canCheckOut),
        shifts: Array.isArray(data?.shifts) ? data.shifts : [],
      })
      if (responseDate) {
        setAttendanceDate(responseDate)
        setSelectedDate(responseDate)
      }
    } catch (e) {
      if (!opts?.silent) setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu chấm công')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }

  // Load dữ liệu cho ADMIN — gộp employees + shiftAssignments thành 1 lần gọi
  const loadAdminAttendance = async (dateOverride?: string, opts?: { silent?: boolean }) => {
    const date = dateOverride || shiftDateRef.current || getVietnamTodayString()
    if (!opts?.silent) setShiftLoading(true)
    try {
      const [empRaw, shiftRaw] = await Promise.all([
        getEmployeesApi(),
        getShiftAssignmentsApi(date),
      ])

      // Normalize employees
      const empData = Array.isArray(empRaw) ? empRaw : (Array.isArray(empRaw?.data) ? empRaw.data : [])
      const activeEmployees = empData
        .filter(e => Number(e.TT) === 1)
        .map(e => ({ mnv: Number(e.MNV), fullName: e.HOTEN, positionName: e.TENCHUCVU || '' }))

      // Normalize shift data
      const shiftData = (shiftRaw && typeof shiftRaw === 'object' && !Array.isArray(shiftRaw)) ? shiftRaw : {}
      const definitions = Array.isArray(shiftData?.shifts) ? shiftData.shifts : []
      const assignmentList = Array.isArray(shiftData?.assignments) ? shiftData.assignments : []

      setShiftEmployees(activeEmployees)
      setShiftDefinitions(definitions)
      setCurrentShiftPage(0)

      // Build assignment map (mnv -> shiftId[]) cho tab Phân ca
      const assignmentMap = {}
      activeEmployees.forEach(e => { assignmentMap[e.mnv] = [] })
      assignmentList.forEach(item => {
        if (!item || typeof item !== 'object') return
        const mnv = Number(item.mnv)
        const shiftId = Number(item.shiftId ?? item.mca)
        if (!mnv || !shiftId) return
        if (!assignmentMap[mnv]) assignmentMap[mnv] = []
        if (!assignmentMap[mnv].includes(shiftId)) assignmentMap[mnv].push(shiftId)
      })
      // Chỉ reset assignment nếu không có thay đổi local chưa save
      if (!hasLocalShiftChangesRef.current) {
        setShiftAssignmentsByEmployee(assignmentMap)
      }

      // Build attendance rows cho tab Chấm công
      // Lưu checkIn/checkOut cho từng shift riêng biệt
      const checkByShift: Record<number, Record<number, { checkIn: string | null; checkOut: string | null }>> = {}
      assignmentList.forEach(item => {
        const mnv = Number(item.mnv)
        const shiftId = Number(item.shiftId ?? item.mca)
        if (!mnv || !shiftId) return
        if (!checkByShift[mnv]) checkByShift[mnv] = {}
        checkByShift[mnv][shiftId] = {
          checkIn: item.checkIn || null,
          checkOut: item.checkOut || null,
        }
      })
      setCheckInOutByShift(checkByShift)

      const rows = activeEmployees.map(emp => ({
        mnv: emp.mnv,
        fullName: emp.fullName,
        positionName: emp.positionName,
        shiftIds: assignmentMap[emp.mnv] || [],
      }))
      // Sắp xếp theo mnv tăng dần
      rows.sort((a, b) => a.mnv - b.mnv)
      setAttendanceRows(rows)
      setCurrentAttendancePage(0)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Lỗi tải dữ liệu chấm công:', e)
    } finally {
      if (!opts?.silent) setShiftLoading(false)
    }
  }

  // Load shift assignments cho tab Phân ca (date có thể khác shiftDate)
  const loadShiftAssignments = async (dateOverride?: string) => {
    await loadAdminAttendance(dateOverride)
  }

  // ── Effects ────────────────────────────────────────────────────────────────

  // Đồng hồ
  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  // Init — load ngay khi mount với ngày hôm nay
  useEffect(() => {
    const today = getVietnamTodayString()
    setSelectedDate(today)
    setShiftDate(today)
    selectedDateRef.current = today
    shiftDateRef.current = today
    if (isStaffMode) {
      loadMyAttendance(today)
    } else {
      loadAdminAttendance(today)
    }
  }, [isStaffMode])

  // Polling 5 giây
  useEffect(() => {
    let interval: number | null = null
    // Delay polling start by 1.5s to let initial load complete
    const startPolling = window.setTimeout(() => {
      interval = window.setInterval(() => {
        if (saving || shiftSaving) return
        if (isStaffMode) {
          loadMyAttendance(selectedDateRef.current, { silent: true })
        } else {
          loadAdminAttendance(shiftDateRef.current, { silent: true })
        }
      }, 5000)
    }, 1500)
    
    return () => {
      if (interval) window.clearInterval(interval)
      window.clearTimeout(startPolling)
    }
  }, [saving, shiftSaving, isStaffMode])

  // Auto reload lúc nửa đêm
  useEffect(() => {
    let midnightTimer: number | null = null
    const schedule = () => {
      midnightTimer = window.setTimeout(async () => {
        const nextDate = getVietnamTodayString()
        setSelectedDate(nextDate)
        setShiftDate(nextDate)
        selectedDateRef.current = nextDate
        shiftDateRef.current = nextDate
        if (isStaffMode) await loadMyAttendance(nextDate)
        else await loadAdminAttendance(nextDate)
        schedule()
      }, getDelayUntilNextVietnamMidnight())
    }
    schedule()
    return () => { if (midnightTimer) window.clearTimeout(midnightTimer) }
  }, [])

  // Auto clear success message
  useEffect(() => {
    if (!success) return
    const timer = window.setTimeout(() => setSuccess(''), 5000)
    return () => window.clearTimeout(timer)
  }, [success])

  // Reset pages khi search thay đổi
  useEffect(() => { setCurrentAttendancePage(0) }, [searchAttendance])
  useEffect(() => { setCurrentShiftPage(0) }, [searchShift])

  // ── Computed ───────────────────────────────────────────────────────────────
  
  // Pagination computed & sorting
  const sortedAttendanceRows = useMemo(
    () => [...attendanceRows].sort((a, b) => a.mnv - b.mnv),
    [attendanceRows],
  )
  const filteredAttendanceRows = useMemo(() => {
    const q = searchAttendance.trim().toLowerCase()
    if (!q) return sortedAttendanceRows
    return sortedAttendanceRows.filter(r =>
      r.fullName.toLowerCase().includes(q) ||
      String(r.mnv).includes(q) ||
      `mnv-${String(r.mnv).padStart(3, '0')}`.includes(q) ||
      (r.positionName || '').toLowerCase().includes(q)
    )
  }, [sortedAttendanceRows, searchAttendance])
  const totalAttendancePages = Math.ceil(filteredAttendanceRows.length / pageSize)
  const paginatedAttendanceRows = filteredAttendanceRows.slice(
    currentAttendancePage * pageSize,
    (currentAttendancePage + 1) * pageSize,
  )

  const sortedShiftEmployees = useMemo(
    () => [...shiftEmployees].sort((a, b) => a.mnv - b.mnv),
    [shiftEmployees],
  )
  const filteredShiftEmployees = useMemo(() => {
    const q = searchShift.trim().toLowerCase()
    if (!q) return sortedShiftEmployees
    return sortedShiftEmployees.filter(e =>
      e.fullName.toLowerCase().includes(q) ||
      String(e.mnv).includes(q) ||
      `mnv-${String(e.mnv).padStart(3, '0')}`.includes(q) ||
      (e.positionName || '').toLowerCase().includes(q)
    )
  }, [sortedShiftEmployees, searchShift])
  const totalShiftPages = Math.ceil(filteredShiftEmployees.length / pageSize)
  const paginatedShiftEmployees = filteredShiftEmployees.slice(
    currentShiftPage * pageSize,
    (currentShiftPage + 1) * pageSize,
  )

  const presentCount = useMemo(
    () => filteredAttendanceRows.filter(r => {
      const shifts = checkInOutByShift[r.mnv] || {}
      return Object.values(shifts).some((s: any) => Boolean(s.checkIn))
    }).length,
    [filteredAttendanceRows, checkInOutByShift],
  )

  const assignedCount = useMemo(
    () => filteredShiftEmployees.filter(e => (shiftAssignmentsByEmployee[e.mnv] || []).length > 0).length,
    [filteredShiftEmployees, shiftAssignmentsByEmployee],
  )

  const totalAssignments = useMemo(
    () => filteredShiftEmployees.reduce((sum, e) => sum + (shiftAssignmentsByEmployee[e.mnv]?.length || 0), 0),
    [filteredShiftEmployees, shiftAssignmentsByEmployee],
  )

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCheckIn = async () => {
    const targetDate = selectedDateRef.current || getVietnamTodayString()
    if (!myAttendance.hasShift) {
      showModal('error', 'Bạn chưa có ca làm trong ngày. Vui lòng liên hệ quản lý để được phân ca.')
      return
    }
    if (gpsStatus !== 'ok') {
      const isNear = await checkGPS()
      if (!isNear) {
        const msg =
          gpsStatus === 'denied' ? 'Bạn chưa cấp quyền vị trí. Vui lòng cho phép truy cập GPS trong trình duyệt và thử lại.'
          : gpsStatus === 'error' ? 'Không thể lấy vị trí GPS. Vui lòng kiểm tra kết nối và thử lại.'
          : `Bạn đang cách cửa hàng gần nhất (${nearestStore ?? ''}) ${gpsDistance ?? '?'} mét. Vui lòng đến đúng địa điểm cửa hàng để chấm công (trong vòng ${STORE_RADIUS_METERS}m).`
        showModal('error', msg)
        return
      }
    }
    setSaving(true); setError('')
    try {
      await checkInAttendanceApi({ date: targetDate })
      showModal('success', `Vào ca thành công ngày ${new Date(targetDate).toLocaleDateString('vi-VN')}`)
      await loadMyAttendance(targetDate)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Không thể vào ca'
      setError(msg); showModal('error', msg)
    } finally { setSaving(false) }
  }

  const handleCheckOut = async () => {
    const targetDate = selectedDateRef.current || getVietnamTodayString()
    setSaving(true); setError('')
    try {
      await checkOutAttendanceApi({ date: targetDate })
      showModal('success', `Ra ca thành công ngày ${new Date(targetDate).toLocaleDateString('vi-VN')}`)
      await loadMyAttendance(targetDate)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Không thể ra ca'
      setError(msg); showModal('error', msg)
    } finally { setSaving(false) }
  }

  const handleDateChange = (value: string) => {
    const nextDate = String(value || '').trim()
    if (!nextDate) return
    setSelectedDate(nextDate)
    selectedDateRef.current = nextDate
    loadMyAttendance(nextDate)
  }

  const handleReloadToday = () => {
    const today = getVietnamTodayString()
    setSelectedDate(today)
    selectedDateRef.current = today
    if (isStaffMode) loadMyAttendance(today)
    else { 
      setHasLocalShiftChanges(false)
      setShiftDate(today)
      shiftDateRef.current = today
      loadAdminAttendance(today)
    }
  }
  // Calculate violation status for a shift
  const calculateViolationStatus = (shift) => {
    const THRESHOLD_MINUTES = 10
    
    // Helper: Extract HH:MM từ time string và convert UTC→UTC+7 nếu cần
    const extractTimeOnly = (timeStr) => {
      if (!timeStr) return null
      try {
        // Nếu là ISO format với Z (UTC timezone) như "2026-04-15T06:19:05.000Z"
        if (timeStr.includes('Z')) {
          const date = new Date(timeStr)
          // Convert UTC → UTC+7 bằng cách thêm 7 giờ
          const utcPlus7 = new Date(date.getTime() + 7 * 60 * 60 * 1000)
          const h = String(utcPlus7.getUTCHours()).padStart(2, '0')
          const m = String(utcPlus7.getUTCMinutes()).padStart(2, '0')
          return `${h}:${m}`
        }
        
        // Nếu là local time format như "08:00:00" hoặc "2026-04-15 08:00:00"
        const match = timeStr.match(/(\d{2}):(\d{2})/)
        if (match) {
          return `${match[1]}:${match[2]}`
        }
        
        return timeStr
      } catch (e) {
        return timeStr
      }
    }
    
    if (!shift.checkIn || !shift.startTime) {
      return { hasViolation: false, type: null, message: null }
    }

    let hasLateCheckIn = false
    let hasEarlyCheckOut = false

    // Check late check-in
    try {
      const checkInTimeStr = extractTimeOnly(shift.checkIn)
      const startTimeStr = extractTimeOnly(shift.startTime)
      
      const [ciH, ciM] = checkInTimeStr.split(':').map(Number)
      const [stH, stM] = startTimeStr.split(':').map(Number)
      
      const checkInMin = ciH * 60 + ciM
      const startMin = stH * 60 + stM
      
      if (checkInMin > startMin) {
        const diffMinutes = checkInMin - startMin
        if (diffMinutes > THRESHOLD_MINUTES) {
          hasLateCheckIn = true
        }
      }
    } catch (e) {
      // Handle error silently
    }

    // Check early check-out
    if (shift.checkOut && shift.endTime) {
      try {
        const checkOutTimeStr = extractTimeOnly(shift.checkOut)
        const endTimeStr = extractTimeOnly(shift.endTime)
        
        const [coH, coM] = checkOutTimeStr.split(':').map(Number)
        const [ehH, ehM] = endTimeStr.split(':').map(Number)
        
        const checkOutMin = coH * 60 + coM
        const endMin = ehH * 60 + ehM
        
        if (checkOutMin < endMin) {
          const diffMinutes = endMin - checkOutMin
          if (diffMinutes > THRESHOLD_MINUTES) {
            hasEarlyCheckOut = true
          }
        }
      } catch (e) {
        // Handle error silently
      }
    }

    if (hasLateCheckIn && hasEarlyCheckOut) {
      return { hasViolation: true, type: 'both', message: 'Đi trễ & Về sớm ⚠️' }
    } else if (hasLateCheckIn) {
      return { hasViolation: true, type: 'late', message: 'Đi trễ ⚠️' }
    } else if (hasEarlyCheckOut) {
      return { hasViolation: true, type: 'early', message: 'Về sớm ⚠️' }
    }

    return { hasViolation: false, type: null, message: null }
  }
  const handleShiftDateChange = (value: string) => {
    setHasLocalShiftChanges(false)
    setShiftDate(value)
    shiftDateRef.current = value
    loadAdminAttendance(value)
  }

  const handleShiftToggle = (mnv, shiftId, checked) => {
    setHasLocalShiftChanges(true)
    setShiftAssignmentsByEmployee(prev => {
      const current = Array.isArray(prev[mnv]) ? prev[mnv] : []
      const next = checked ? Array.from(new Set([...current, shiftId])) : current.filter(id => id !== shiftId)
      return { ...prev, [mnv]: next }
    })
  }

  const handleShiftSave = async () => {
    setShiftSaving(true)
    try {
      const payload = shiftEmployees.map(e => ({
        employeeId: e.mnv,
        shiftIds: shiftAssignmentsByEmployee[e.mnv] || [],
      }))
      const result = await saveShiftAssignmentsApi({ date: shiftDate, assignments: payload })
      showModal('success', `Đã lưu phân ca (${result.assignedCount || 0} ca)`)
      setHasLocalShiftChanges(false)
      await loadAdminAttendance(shiftDate)
    } catch (e) {
      showModal('error', 'Không thể lưu phân ca')
    } finally { setShiftSaving(false) }
  }

  // ── Modal component ────────────────────────────────────────────────────────
  const ModalEl = modal ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 mx-4" onClick={e => e.stopPropagation()}>
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${modal.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
          {modal.type === 'success' ? <CheckCircle2Icon className="h-7 w-7 text-green-600" /> : <AlertCircleIcon className="h-7 w-7 text-red-500" />}
        </div>
        <p className="text-center text-base font-semibold text-gray-900 mb-1">{modal.type === 'success' ? 'Thành công' : 'Có lỗi xảy ra'}</p>
        <p className="text-center text-sm text-gray-500 mb-5">{modal.message}</p>
        <button type="button" onClick={closeModal} className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-colors ${modal.type === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>Đóng</button>
      </div>
    </div>
  ) : null

  // ══════════════════════════════════════════════════════════════════════════
  // STAFF VIEW
  // ══════════════════════════════════════════════════════════════════════════
  if (isStaffMode) {
    const currentDateDisplay = attendanceDate ? new Date(attendanceDate).toLocaleDateString('vi-VN') : 'Hôm nay'
    const gpsStatusConfig = {
      idle:     { color: 'bg-gray-100 text-gray-500',   text: 'Chưa kiểm tra vị trí' },
      checking: { color: 'bg-blue-100 text-blue-600',   text: 'Đang xác định vị trí...' },
      ok:       { color: 'bg-green-100 text-green-600', text: `Đang ở cửa hàng ${nearestStore ?? ''} (cách ${gpsDistance ?? 0}m)` },
      far:      { color: 'bg-red-100 text-red-600',     text: `Ngoài phạm vi — cửa hàng gần nhất: ${nearestStore ?? ''} (cách ${gpsDistance ?? '?'}m, tối đa ${STORE_RADIUS_METERS}m)` },
      denied:   { color: 'bg-red-100 text-red-600',     text: 'Chưa cấp quyền GPS' },
      error:    { color: 'bg-amber-100 text-amber-600', text: 'Lỗi xác định vị trí' },
    }
    const gpsCfg = gpsStatusConfig[gpsStatus]

    return (
      <div className="space-y-6">
        {ModalEl}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
            {/* Trái */}
            <div className="space-y-6 border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                  <Clock3Icon className="h-3.5 w-3.5" />Trạng thái hiện tại
                </span>
                <p className="mt-4 text-4xl font-bold tracking-tight text-slate-800 lg:text-5xl">
                  {currentTime.toLocaleTimeString('vi-VN', { hour12: false })}
                </p>
                <p className="mt-2 text-sm text-slate-500">Ngày chấm công: {currentDateDisplay}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input type="date" value={selectedDate} onChange={e => handleDateChange(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400/40" />
                <button type="button" onClick={handleReloadToday}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <RefreshCcwIcon className="h-4 w-4" />Làm mới
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button type="button" onClick={handleCheckIn} disabled={saving || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2ECC71] px-4 py-3 text-sm font-semibold text-white hover:bg-[#29b765] disabled:opacity-60">
                  <LogInIcon className="h-4 w-4" />{saving ? 'Đang xử lý...' : 'Vào ca'}
                </button>
                <button type="button" onClick={handleCheckOut} disabled={saving || loading || !myAttendance.canCheckOut}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF4D6D] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e64462] disabled:opacity-60">
                  <LogOutIcon className="h-4 w-4" />{saving ? 'Đang xử lý...' : 'Ra ca'}
                </button>
              </div>
            </div>
            {/* Phải */}
            <div className="space-y-4 bg-slate-50 p-6">
              <h3 className="text-sm font-semibold text-slate-800">Xác thực điều kiện</h3>
              <div className={`rounded-xl border bg-white p-3 ${myAttendance.hasShift ? 'border-slate-200' : 'border-red-200'}`}>
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 ${myAttendance.hasShift ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <Clock3Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Ca làm trong ngày</p>
                    <p className={`text-xs ${myAttendance.hasShift ? 'text-green-600' : 'text-red-500'}`}>
                      {myAttendance.hasShift ? 'Đã có ca làm hôm nay' : 'Chưa được phân ca hôm nay'}
                    </p>
                  </div>
                  {myAttendance.hasShift
                    ? <CheckCircle2Icon className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                    : <AlertCircleIcon className="mt-0.5 h-4 w-4 text-red-400 shrink-0" />}
                </div>
              </div>
              <div className={`rounded-xl border bg-white p-3 ${gpsStatus === 'ok' ? 'border-slate-200' : ['far', 'denied', 'error'].includes(gpsStatus) ? 'border-red-200' : 'border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 ${gpsCfg.color}`}><MapPinIcon className="h-4 w-4" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Vị trí GPS</p>
                    <p className={`text-xs ${gpsStatus === 'ok' ? 'text-green-600' : gpsStatus === 'checking' ? 'text-blue-500' : gpsStatus === 'idle' ? 'text-slate-400' : 'text-red-500'}`}>
                      {gpsCfg.text}
                    </p>
                  </div>
                  {gpsStatus === 'ok' ? <CheckCircle2Icon className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                    : ['far', 'denied', 'error'].includes(gpsStatus) ? <AlertCircleIcon className="mt-0.5 h-4 w-4 text-red-400 shrink-0" /> : null}
                </div>
              </div>
              <button type="button" onClick={checkGPS} disabled={gpsStatus === 'checking'}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60 transition-colors">
                <MapPinIcon className="h-4 w-4" />
                {gpsStatus === 'checking' ? 'Đang xác định vị trí...' : 'Kiểm tra vị trí GPS'}
              </button>
              {myAttendance.hasShift && gpsStatus === 'ok' ? (
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-green-700">✓ Đủ điều kiện chấm công</p>
                </div>
              ) : (myAttendance.hasShift || gpsStatus !== 'idle') ? (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-red-600">Chưa đủ điều kiện chấm công</p>
                  <p className="text-xs text-red-400 mt-0.5">
                    {!myAttendance.hasShift ? 'Thiếu ca làm · ' : ''}
                    {gpsStatus !== 'ok' && gpsStatus !== 'idle' ? 'Vị trí chưa hợp lệ' : ''}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <HistoryIcon className="h-5 w-5 text-slate-600" />
            <h3 className="text-base font-semibold text-slate-900">Lịch sử ca làm trong ngày</h3>
          </div>
          {!myAttendance.hasShift ? (
            <div className="px-6 py-5 text-sm text-slate-500">Không có ca làm trong ngày đã chọn.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Ca</th>
                    <th className="px-6 py-3">Khung giờ</th>
                    <th className="px-6 py-3">Vào ca</th>
                    <th className="px-6 py-3">Ra ca</th>
                    <th className="px-6 py-3">Trạng thái</th>
                    <th className="px-6 py-3">Vi phạm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myAttendance.shifts.map(shift => {
                    const hasIn = Boolean(shift.checkIn)
                    const hasOut = Boolean(shift.checkOut)
                    const statusText = hasOut ? 'Hoàn thành' : hasIn ? 'Đang làm' : 'Chưa bắt đầu'
                    const statusClass = hasOut ? 'bg-green-50 text-green-700' : hasIn ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                    const violation = calculateViolationStatus(shift)
                    const violationBg = !violation.hasViolation ? 'bg-slate-50 text-slate-500'
                      : violation.type === 'both' ? 'bg-red-100 text-red-700 font-semibold'
                      : 'bg-amber-100 text-amber-700'
                    return (
                      <tr key={shift.mpcl}>
                        <td className="px-6 py-3 font-medium text-slate-800">{shift.shiftName || `Ca #${shift.shiftId}`}</td>
                        <td className="px-6 py-3 text-slate-600">{shift.startTime || '--:--'} - {shift.endTime || '--:--'}</td>
                        <td className="px-6 py-3 text-slate-600">{hasIn ? new Date(shift.checkIn).toLocaleTimeString('vi-VN') : '-'}</td>
                        <td className="px-6 py-3 text-slate-600">{hasOut ? new Date(shift.checkOut).toLocaleTimeString('vi-VN') : '-'}</td>
                        <td className="px-6 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{statusText}</span>
                        </td>
                        <td className="px-6 py-3">
                          {violation.hasViolation ? (
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${violationBg}`}>{violation.message}</span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN / HR CHECK
  // ══════════════════════════════════════════════════════════════════════════
  if (!isAdminOrHr) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <AlertCircleIcon className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-base font-semibold text-gray-600">Không có quyền truy cập</p>
        <p className="mt-1 text-sm text-gray-400">Trang này chỉ dành cho tài khoản Admin và HR.</p>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ADMIN / MANAGE VIEW
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {ModalEl}

      {/* Tabs */}
      <div className="flex gap-2 border-b mb-4">
        <button
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${tab === 'attendance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
          onClick={() => setTab('attendance')}
        >Chấm công</button>
        <button
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${tab === 'shift' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
          onClick={() => setTab('shift')}
        >Phân ca</button>
      </div>

      {tab === 'attendance' ? (
        // ── CHẤM CÔNG ──────────────────────────────────────────────────────
        <section className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Chấm công</h2>
              <p className="mt-0.5 text-sm text-gray-400">Ngày: {formatDateVN(shiftDate)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchAttendance}
                  onChange={e => setSearchAttendance(e.target.value)}
                  className="pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50 w-56"
                />
                {searchAttendance && (
                  <button
                    type="button"
                    onClick={() => setSearchAttendance('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="Xóa tìm kiếm"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <input type="date" value={shiftDate} onChange={e => handleShiftDateChange(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
              <button type="button" onClick={handleReloadToday}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <RefreshCcwIcon className="h-4 w-4" />Hôm nay
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 px-5 py-4 border-b border-gray-100">
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">{searchAttendance ? 'Kết quả tìm kiếm' : 'Tổng nhân viên'}</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{filteredAttendanceRows.length}{searchAttendance ? <span className="text-sm font-normal text-gray-400"> / {sortedAttendanceRows.length}</span> : ''}</p>
            </div>
            <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3">
              <p className="text-xs text-green-700">Có mặt</p>
              <p className="mt-1 text-xl font-semibold text-green-800">{presentCount}</p>
            </div>
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-xs text-red-600">Vắng</p>
              <p className="mt-1 text-xl font-semibold text-red-700">{filteredAttendanceRows.length - presentCount}</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {shiftLoading ? (
              <div className="py-16 text-center text-sm text-gray-400">Đang tải dữ liệu...</div>
            ) : attendanceRows.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">Không có dữ liệu chấm công.</div>
            ) : filteredAttendanceRows.length === 0 ? (
              <div className="py-16 text-center">
                <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <p className="text-sm font-medium text-gray-500">Không tìm thấy kết quả cho "<span className="text-blue-600">{searchAttendance}</span>"</p>
                <button onClick={() => setSearchAttendance('')} className="mt-2 text-xs text-blue-500 hover:underline">Xóa tìm kiếm</button>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Nhân viên</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Chức vụ</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ca làm</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Vào ca</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ra ca</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Vi phạm</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedAttendanceRows.map(item => {
                    const initials = item.fullName.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase()
                    const empShifts = shiftDefinitions.filter(s => (item.shiftIds || []).includes(s.mca))
                    const isPresent = Object.values(checkInOutByShift[item.mnv] || {}).some((s: any) => Boolean(s.checkIn))
                    return (
                      <tr key={item.mnv} className="hover:bg-gray-50/60 transition-colors align-middle">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{item.fullName}</p>
                              <p className="text-[11px] text-gray-400">MNV-{String(item.mnv).padStart(3, '0')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-sm">{item.positionName || 'Chưa cập nhật'}</td>
                        <td className="px-5 py-3.5">
                          {empShifts.length === 0 ? (
                            <span className="text-xs text-gray-300 italic">Chưa phân ca</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {empShifts.map(shift => (
                                <span key={shift.mca} className="text-sm text-gray-700 font-medium">
                                  {shift.shiftName || `Ca #${shift.mca}`}
                                  <span className="ml-1.5 text-xs text-gray-400 font-normal">{shift.startTime || '--:--'}–{shift.endTime || '--:--'}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700">
                          {empShifts.length === 0 ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {empShifts.map(shift => {
                                const shiftCheck = (checkInOutByShift[item.mnv] || {})[shift.mca] || {}
                                return (
                                  <span key={shift.mca} className="text-sm text-gray-700">
                                    {shiftCheck.checkIn
                                      ? new Date(shiftCheck.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                      : '—'}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700">
                          {empShifts.length === 0 ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {empShifts.map(shift => {
                                const shiftCheck = (checkInOutByShift[item.mnv] || {})[shift.mca] || {}
                                return (
                                  <span key={shift.mca} className="text-sm text-gray-700">
                                    {shiftCheck.checkOut
                                      ? new Date(shiftCheck.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                      : '—'}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-left">
                          {empShifts.length === 0 ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {empShifts.map(shift => {
                                const shiftCheck = (checkInOutByShift[item.mnv] || {})[shift.mca] || {}
                                const violation = calculateViolationStatus({
                                  checkIn: shiftCheck.checkIn,
                                  checkOut: shiftCheck.checkOut,
                                  startTime: shift.startTime,
                                  endTime: shift.endTime,
                                })
                                
                                if (!violation.hasViolation) {
                                  return <span key={shift.mca} className="text-xs text-gray-300">—</span>
                                }
                                
                                const badgeColor = violation.type === 'both' 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-amber-100 text-amber-700'
                                
                                return (
                                  <span key={shift.mca} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${badgeColor}`}>
                                    {violation.message}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {isPresent
                            ? <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-green-700"><CheckCircle2Icon className="h-3 w-3" />Có mặt</span>
                            : empShifts.length === 0
                              ? <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">Chưa ca</span>
                              : <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-600">Vắng</span>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination for Attendance */}
          {filteredAttendanceRows.length > 0 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-600">
                Hiển thị {currentAttendancePage * pageSize + 1}-{Math.min((currentAttendancePage + 1) * pageSize, filteredAttendanceRows.length)} / {filteredAttendanceRows.length} bản ghi
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentAttendancePage(prev => Math.max(0, prev - 1))}
                  disabled={currentAttendancePage === 0}
                  className="p-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg"
                  title="Trang trước"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-fit">
                  {currentAttendancePage + 1}/{totalAttendancePages}
                </span>
                <button
                  onClick={() => setCurrentAttendancePage(prev => Math.min(totalAttendancePages - 1, prev + 1))}
                  disabled={currentAttendancePage === totalAttendancePages - 1}
                  className="p-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg"
                  title="Trang tiếp"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </section>
      ) : (
        // ── PHÂN CA ────────────────────────────────────────────────────────
        <section className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Phân ca làm việc</h2>
              <p className="mt-0.5 text-sm text-gray-400">Ngày: {formatDateVN(shiftDate)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchShift}
                  onChange={e => setSearchShift(e.target.value)}
                  className="pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50 w-56"
                />
                {searchShift && (
                  <button
                    type="button"
                    onClick={() => setSearchShift('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="Xóa tìm kiếm"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <input type="date" value={shiftDate} onChange={e => handleShiftDateChange(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
              <button type="button" onClick={() => loadAdminAttendance(shiftDate)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <RefreshCcwIcon className="h-4 w-4" />Làm mới
              </button>
              <button type="button" onClick={handleShiftSave} disabled={shiftSaving || shiftLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                <SaveIcon className="h-4 w-4" />{shiftSaving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 px-5 py-4 border-b border-gray-100">
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">{searchShift ? 'Kết quả tìm kiếm' : 'Tổng nhân viên'}</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{filteredShiftEmployees.length}{searchShift ? <span className="text-sm font-normal text-gray-400"> / {sortedShiftEmployees.length}</span> : ''}</p>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-xs text-blue-700">Đã được phân ca</p>
              <p className="mt-1 text-xl font-semibold text-blue-800">{assignedCount}</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-xs text-amber-700">Tổng ca đã phân</p>
              <p className="mt-1 text-xl font-semibold text-amber-800">{totalAssignments}</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {shiftLoading ? (
              <div className="py-16 text-center text-sm text-gray-400">Đang tải dữ liệu...</div>
            ) : shiftEmployees.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">Không có dữ liệu phân ca.</div>
            ) : filteredShiftEmployees.length === 0 ? (
              <div className="py-16 text-center">
                <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <p className="text-sm font-medium text-gray-500">Không tìm thấy kết quả cho "<span className="text-blue-600">{searchShift}</span>"</p>
                <button onClick={() => setSearchShift('')} className="mt-2 text-xs text-blue-500 hover:underline">Xóa tìm kiếm</button>
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Nhân viên</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Chức vụ</th>
                    {shiftDefinitions.map(shift => (
                      <th key={shift.mca} className="px-5 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <div>{shift.shiftName}</div>
                        <div className="normal-case font-normal text-gray-400">{shift.startTime || '--:--'}–{shift.endTime || '--:--'}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedShiftEmployees.map(emp => {
                    const initials = emp.fullName.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase()
                    return (
                      <tr key={emp.mnv} className="hover:bg-gray-50/60 transition-colors align-middle">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{emp.fullName}</p>
                              <p className="text-[11px] text-gray-400">MNV-{String(emp.mnv).padStart(3, '0')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-sm">{emp.positionName || 'Chưa cập nhật'}</td>
                        {shiftDefinitions.map(shift => {
                          const checked = (shiftAssignmentsByEmployee[emp.mnv] || []).includes(shift.mca)
                          return (
                            <td key={shift.mca} className="px-5 py-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={e => handleShiftToggle(emp.mnv, shift.mca, e.target.checked)}
                                disabled={shiftSaving || shiftLoading}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination for Shift */}
          {filteredShiftEmployees.length > 0 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-600">
                Hiển thị {currentShiftPage * pageSize + 1}-{Math.min((currentShiftPage + 1) * pageSize, filteredShiftEmployees.length)} / {filteredShiftEmployees.length} bản ghi
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentShiftPage(prev => Math.max(0, prev - 1))}
                  disabled={currentShiftPage === 0}
                  className="p-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg"
                  title="Trang trước"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-fit">
                  {currentShiftPage + 1}/{totalShiftPages}
                </span>
                <button
                  onClick={() => setCurrentShiftPage(prev => Math.min(totalShiftPages - 1, prev + 1))}
                  disabled={currentShiftPage === totalShiftPages - 1}
                  className="p-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg"
                  title="Trang tiếp"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}