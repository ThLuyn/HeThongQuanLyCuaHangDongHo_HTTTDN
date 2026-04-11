// @ts-nocheck
import { AlertCircleIcon, CheckCircle2Icon, Clock3Icon, HistoryIcon, LogInIcon, LogOutIcon, MapPinIcon, RefreshCcwIcon, SaveIcon, WifiIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { loadAuthSession } from '../utils/authStorage'
import {
  checkInAttendanceApi,
  checkOutAttendanceApi,
  getMyAttendanceStatusApi,
  getTodayAttendanceApi,
  saveTodayAttendanceApi,
  getEmployeesApi,
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
  const isStaffMode = viewMode === 'self' || (viewMode !== 'manage' && currentRole === 'staff')
  const [tab, setTab] = useState<'attendance' | 'shift'>('attendance')

  // State for shift assignment
  const [shiftLoading, setShiftLoading] = useState(false)
  const [shiftSaving, setShiftSaving] = useState(false)
  const [shiftError, setShiftError] = useState('')
  const [shiftSuccess, setShiftSuccess] = useState('')
  const [shiftDate, setShiftDate] = useState(getVietnamTodayString())
  const [shiftEmployees, setShiftEmployees] = useState([])
  const [shiftDefinitions, setShiftDefinitions] = useState([])
  const [shiftAssignmentsByEmployee, setShiftAssignmentsByEmployee] = useState({})

  // Modal notification state
  const [modal, setModal] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const showModal = (type: 'success' | 'error', message: string) => setModal({ type, message })
  const closeModal = () => setModal(null)

  // GPS state
  const STORES = [
    { name: '273 An Dương Vương, Phường Chợ Quán, TP. Hồ Chí Minh', lat: 10.7599171, lng: 106.6822583 },
    { name: '35A Tân Trang, Phường Tân Hòa, TP. Hồ Chí Minh',  lat: 10.7788976, lng: 106.6547478 },
    { name: '13C Khu Bờ Hàng, Phường Phú Định, TP. Hồ Chí Minh',  lat: 10.713926, lng: 106.622889 },
    { name: '78/9 An Dương Vương, Phường An Đông, TP. Hồ Chí Minh',  lat: 10.713926, lng: 106.622889 },
  ]
  const STORE_RADIUS_METERS = 100
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'checking' | 'ok' | 'far' | 'denied' | 'error'>('idle')
  const [gpsDistance, setGpsDistance] = useState<number | null>(null)
  const [nearestStore, setNearestStore] = useState<string | null>(null)

  function calcDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371000
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  const checkGPS = (): Promise<boolean> => {
    return new Promise((resolve) => {
      setGpsStatus('checking')
      if (!navigator.geolocation) {
        setGpsStatus('error')
        resolve(false)
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          // Tìm cửa hàng gần nhất
          let minDist = Infinity
          let closestStore = STORES[0]
          for (const store of STORES) {
            const d = calcDistanceMeters(latitude, longitude, store.lat, store.lng)
            if (d < minDist) { minDist = d; closestStore = store }
          }
          const dist = Math.round(minDist)
          setGpsDistance(dist)
          setNearestStore(closestStore.name)
          if (dist <= STORE_RADIUS_METERS) {
            setGpsStatus('ok')
            resolve(true)
          } else {
            setGpsStatus('far')
            resolve(false)
          }
        },
        (err) => {
          setGpsStatus(err.code === 1 ? 'denied' : 'error')
          resolve(false)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }
    // Load shift assignments
    const loadShiftAssignments = async (dateOverride?: string) => {
      setShiftLoading(true)
      setShiftError('')
      try {
        const date = dateOverride || shiftDate
        if (typeof getEmployeesApi !== 'function' || typeof getShiftAssignmentsApi !== 'function') {
          throw new Error('API chưa s�ba�n sàng, vui lòng th�bb� l�ba�i sau.')
        }
        const [empRaw, shiftRaw] = await Promise.all([
          getEmployeesApi(),
          getShiftAssignmentsApi(date),
        ])
        // Normalize: some APIs wrap response in .data or return array directly
        const empData = Array.isArray(empRaw) ? empRaw : (Array.isArray(empRaw?.data) ? empRaw.data : [])
        const shiftData = (shiftRaw && typeof shiftRaw === 'object' && !Array.isArray(shiftRaw)) ? shiftRaw : {}
        const activeEmployees = empData.filter(e => Number(e.TT) === 1).map(e => ({
          mnv: Number(e.MNV),
          fullName: e.HOTEN,
          positionName: e.TENCHUCVU || '',
        }))
        setShiftEmployees(activeEmployees)
        setShiftDefinitions(Array.isArray(shiftData?.shifts) ? shiftData.shifts : [])
        // Build assignment map
        const assignmentMap = {}
        const assignmentList = Array.isArray(shiftData?.assignments) ? shiftData.assignments : []
        assignmentList.forEach(item => {
          if (!item || typeof item !== 'object') return
          const mnv = Number(item.mnv)
          const shiftId = Number(item.shiftId ?? item.mca)
          if (!mnv || !shiftId) return
          if (!assignmentMap[mnv]) assignmentMap[mnv] = []
          assignmentMap[mnv].push(shiftId)
        })
        activeEmployees.forEach(e => { if (!assignmentMap[e.mnv]) assignmentMap[e.mnv] = [] })
        setShiftAssignmentsByEmployee(assignmentMap)
      } catch (e) {
        setShiftError('Không thể tải dữ liệu phân ca: ' + (e?.message || JSON.stringify(e)))
        // eslint-disable-next-line no-console
        console.error('Lỗi tải phân ca:', e)
      } finally {
        setShiftLoading(false)
      }
    }

    const handleShiftDateChange = (value) => {
      setShiftDate(value)
      loadShiftAssignments(value)
    }

    const handleShiftToggle = (mnv, shiftId, checked) => {
      setShiftAssignmentsByEmployee(prev => {
        const current = Array.isArray(prev[mnv]) ? prev[mnv] : []
        const next = checked
          ? Array.from(new Set([...current, shiftId]))
          : current.filter(id => id !== shiftId)
        return { ...prev, [mnv]: next }
      })
    }

    const handleShiftSave = async () => {
      setShiftSaving(true)
      setShiftError('')
      try {
        if (typeof saveShiftAssignmentsApi !== 'function') {
          throw new Error('API lưu phân ca chưa sẵn sàng.')
        }
        const payload = shiftEmployees.map(e => ({
          employeeId: e.mnv,
          shiftIds: shiftAssignmentsByEmployee[e.mnv] || [],
        }))
        const result = await saveShiftAssignmentsApi({
          date: shiftDate,
          assignments: payload,
        })
        setShiftSuccess(`Đã lưu phân ca (${result.assignedCount || 0} ca)`)
        showModal('success', `Đã lưu phân ca (${result.assignedCount || 0} ca)`)
        await loadShiftAssignments(shiftDate)
      } catch (e) {
        setShiftError('Không thể lưu phân ca')
        showModal('error', 'Không thể lưu phân ca')
      } finally {
        setShiftSaving(false)
        setTimeout(() => setShiftSuccess(''), 3000)
      }
    }

    const assignedCount = useMemo(() => shiftEmployees.filter(e => (shiftAssignmentsByEmployee[e.mnv] || []).length > 0).length, [shiftEmployees, shiftAssignmentsByEmployee])
    const totalAssignments = useMemo(() => shiftEmployees.reduce((sum, e) => sum + (shiftAssignmentsByEmployee[e.mnv]?.length || 0), 0), [shiftEmployees, shiftAssignmentsByEmployee])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [attendanceDate, setAttendanceDate] = useState('')
  const [selectedDate, setSelectedDate] = useState(getVietnamTodayString())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [rows, setRows] = useState([])
  const [presentMap, setPresentMap] = useState({})
  const [myAttendance, setMyAttendance] = useState({
    hasShift: false,
    canCheckIn: false,
    canCheckOut: false,
    shifts: [],
  })

  const loadAttendance = async (dateOverride?: string, options?: { silent?: boolean }) => {
    const requestDate = String(dateOverride || selectedDate || '').trim()
    const isSilent = Boolean(options?.silent)
    if (!isSilent) {
      setLoading(true)
      setError('')
    }
    try {
      if (isStaffMode) {
        const data = await getMyAttendanceStatusApi(requestDate || undefined)
        const responseDate = String(data?.date || '').slice(0, 10)
        setRows([])
        setPresentMap({})
        setMyAttendance({
          hasShift: Boolean(data?.hasShift),
          canCheckIn: Boolean(data?.canCheckIn),
          canCheckOut: Boolean(data?.canCheckOut),
          shifts: Array.isArray(data?.shifts) ? data.shifts : [],
        })
        setAttendanceDate(responseDate)
        setSelectedDate(responseDate)
      }
      else {
        const data = await getTodayAttendanceApi(requestDate || undefined)
        const employees = Array.isArray(data?.employees) ? data.employees : []
        const mapped = employees.reduce((acc, item) => {
          acc[Number(item.mnv)] = Boolean(item.present)
          return acc
        }, {})

        setRows(employees)
        const responseDate = String(data?.date || '').slice(0, 10)
        setAttendanceDate(responseDate)
        setSelectedDate(responseDate)
        setPresentMap(mapped)
      }

    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể tải dữ liệu chấm công hôm nay'
      setError(message)
    } finally {
      if (!isSilent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    loadAttendance()
    if (!isStaffMode) { loadShiftAssignments() }
  }, [])

  useEffect(() => {
    let midnightTimer: number | null = null

    const scheduleNextMidnightReload = () => {
      midnightTimer = window.setTimeout(async () => {
        const nextDate = getVietnamTodayString()
        setSelectedDate(nextDate)
        await loadAttendance(nextDate)
        scheduleNextMidnightReload()
      }, getDelayUntilNextVietnamMidnight())
    }

    scheduleNextMidnightReload()

    return () => {
      if (midnightTimer) {
        window.clearTimeout(midnightTimer)
      }
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (saving) {
        return
      }
      const targetDate = selectedDate || attendanceDate || undefined
      loadAttendance(targetDate, { silent: true })
    }, 3000)

    return () => {
      window.clearInterval(interval)
    }
  }, [selectedDate, attendanceDate, saving])

  useEffect(() => {
    if (!success) {
      return
    }
    const timer = window.setTimeout(() => setSuccess(''), 5000)
    return () => window.clearTimeout(timer)
  }, [success])

  const presentCount = useMemo(
    () => rows.reduce((count, item) => count + (presentMap[Number(item.mnv)] ? 1 : 0), 0),
    [rows, presentMap],
  )

  const allChecked = rows.length > 0 && rows.every((item) => presentMap[Number(item.mnv)])

  const handleToggleAll = (checked) => {
    const next = {}
    rows.forEach((item) => {
      next[Number(item.mnv)] = checked
    })
    setPresentMap(next)
  }

  const handleSave = async () => {
    if (isStaffMode) return
    const presentEmployeeIds = rows
      .filter((item) => presentMap[Number(item.mnv)])
      .map((item) => Number(item.mnv))
    setSaving(true)
    setError('')
    try {
      const result = await saveTodayAttendanceApi({
        presentEmployeeIds,
        date: selectedDate || attendanceDate || undefined,
      })
      setSuccess(`Đã lưu chấm công ngày ${new Date(result.date).toLocaleDateString('vi-VN')} (${result.presentCount} nhân viên có mặt)`)
      showModal('success', `Đã lưu chấm công ngày ${new Date(result.date).toLocaleDateString('vi-VN')} (${result.presentCount} nhân viên có mặt)`)
      await loadAttendance(selectedDate || attendanceDate)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể lưu chấm công hôm nay'
      setError(message)
      showModal('error', message)
    } finally {
      setSaving(false)
    }
  }

  const handleCheckIn = async () => {
    const targetDate = selectedDate || attendanceDate || getVietnamTodayString()
    if (!myAttendance.hasShift) {
      showModal('error', 'Bạn chưa có ca làm trong ngày. Vui lòng liên hệ quản lý để được phân ca.')
      return
    }
    const isNearStore = await checkGPS()
    if (!isNearStore) {
      const dist = gpsDistance
      const gpsMsg = gpsStatus === 'denied'
        ? 'Bạn chưa cấp quyền vị trí. Vui lòng cho phép truy cập GPS trong trình duyệt và thử lại.'
        : gpsStatus === 'error'
        ? 'Không thể lấy vị trí GPS. Vui lòng kiểm tra kết nối và thử lại.'
        : `Bạn đang cách cửa hàng gần nhất (${nearestStore ?? ''}) ${dist ?? '?'} mét. Vui lòng đến đúng địa điểm cửa hàng để chấm công (trong vòng ${STORE_RADIUS_METERS}m).`
      showModal('error', gpsMsg)
      return
    }
    setSaving(true)
    setError('')
    try {
      await checkInAttendanceApi({ date: targetDate })
      setSuccess(`Vào ca thành công ngày ${new Date(targetDate).toLocaleDateString('vi-VN')}`)
      showModal('success', `Vào ca thành công ngày ${new Date(targetDate).toLocaleDateString('vi-VN')}`)
      await loadAttendance(targetDate)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể vào ca'
      setError(message)
      showModal('error', message)
    } finally {
      setSaving(false)
    }
  }

  const handleCheckOut = async () => {
    const targetDate = selectedDate || attendanceDate || getVietnamTodayString()
    setSaving(true)
    setError('')
    try {
      await checkOutAttendanceApi({ date: targetDate })
      setSuccess(`Ra ca thành công ngày ${new Date(targetDate).toLocaleDateString('vi-VN')}`)
      showModal('success', `Ra ca thành công ngày ${new Date(targetDate).toLocaleDateString('vi-VN')}`)
      await loadAttendance(targetDate)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể ra ca'
      setError(message)
      showModal('error', message)
    } finally {
      setSaving(false)
    }
  }

  const handleDateChange = (value: string) => {
    const nextDate = String(value || '').trim()
    setSelectedDate(nextDate)
    if (nextDate) loadAttendance(nextDate)
  }

  const handleReloadToday = () => {
    const today = getVietnamTodayString()
    setSelectedDate(today)
    loadAttendance(today)
  }

  if (isStaffMode) {
    const currentDateDisplay = attendanceDate
      ? new Date(attendanceDate).toLocaleDateString('vi-VN')
      : 'Hôm nay'
    const isAlreadyCheckedIn = myAttendance.shifts.some((shift) => Boolean(shift.checkIn))

    const gpsStatusConfig = {
      idle:     { color: 'bg-gray-100 text-gray-500',   icon: '📍', text: 'Chưa kiểm tra vị trí' },
      checking: { color: 'bg-blue-100 text-blue-600',   icon: '⏳', text: 'Đang xác định vị trí...' },
      ok:       { color: 'bg-green-100 text-green-600', icon: '✓',  text: `Đang ở cửa hàng ${nearestStore ?? ''} (cách ${gpsDistance ?? 0}m)` },
      far:      { color: 'bg-red-100 text-red-600',     icon: '✗',  text: `Ngoài phạm vi — cửa hàng gần nhất: ${nearestStore ?? ''} (cách ${gpsDistance ?? '?'}m, tối đa ${STORE_RADIUS_METERS}m)` },
      denied:   { color: 'bg-red-100 text-red-600',     icon: '✗',  text: 'Chưa cấp quyền GPS' },
      error:    { color: 'bg-amber-100 text-amber-600', icon: '!',  text: 'Lỗi xác định vị trí' },
    }
    const gpsCfg = gpsStatusConfig[gpsStatus]
    const canCheckIn = myAttendance.hasShift && gpsStatus === 'ok'

    return (
      <div className="space-y-6">
        {/* Modal thông báo */}
        {modal && (
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
        )}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
            {/* Trái: đồng hồ + nút */}
            <div className="space-y-6 border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                  <Clock3Icon className="h-3.5 w-3.5" />
                  Trạng thái hiện tại
                </span>
                <p className="mt-4 text-4xl font-bold tracking-tight text-slate-800 lg:text-5xl">
                  {currentTime.toLocaleTimeString('vi-VN', { hour12: false })}
                </p>
                <p className="mt-2 text-sm text-slate-500">Ngày chấm công: {currentDateDisplay}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400/40" />
                <button type="button" onClick={handleReloadToday}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <RefreshCcwIcon className="h-4 w-4" />Làm mới
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button type="button" onClick={handleCheckIn}
                  disabled={saving || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2ECC71] px-4 py-3 text-sm font-semibold text-white hover:bg-[#29b765] disabled:opacity-60">
                  <LogInIcon className="h-4 w-4" />
                  {saving ? 'Đang xử lý...' : 'Vào ca'}
                </button>
                <button type="button" onClick={handleCheckOut}
                  disabled={saving || loading || !myAttendance.canCheckOut}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF4D6D] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e64462] disabled:opacity-60">
                  <LogOutIcon className="h-4 w-4" />
                  {saving ? 'Đang xử lý...' : 'Ra ca'}
                </button>
              </div>
            </div>

            {/* Phải: xác thực điều kiện */}
            <div className="space-y-4 bg-slate-50 p-6">
              <h3 className="text-sm font-semibold text-slate-800">Xác thực điều kiện</h3>

              {/* Điều kiện 1: Ca làm */}
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

              {/* Điều kiện 2: GPS */}
              <div className={`rounded-xl border bg-white p-3 ${gpsStatus === 'ok' ? 'border-slate-200' : gpsStatus === 'idle' || gpsStatus === 'checking' ? 'border-slate-200' : 'border-red-200'}`}>
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 ${gpsCfg.color}`}>
                    <MapPinIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Vị trí GPS</p>
                    <p className={`text-xs ${gpsStatus === 'ok' ? 'text-green-600' : gpsStatus === 'checking' ? 'text-blue-500' : gpsStatus === 'idle' ? 'text-slate-400' : 'text-red-500'}`}>
                      {gpsCfg.text}
                    </p>
                  </div>
                  {gpsStatus === 'ok'
                    ? <CheckCircle2Icon className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                    : gpsStatus === 'far' || gpsStatus === 'denied' || gpsStatus === 'error'
                    ? <AlertCircleIcon className="mt-0.5 h-4 w-4 text-red-400 shrink-0" />
                    : null}
                </div>
              </div>

              {/* Nút kiểm tra GPS */}
              <button type="button" onClick={checkGPS} disabled={gpsStatus === 'checking'}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60 transition-colors">
                <MapPinIcon className="h-4 w-4" />
                {gpsStatus === 'checking' ? 'Đang xác định vị trí...' : 'Kiểm tra vị trí GPS'}
              </button>

              {/* Trạng thái tổng */}
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
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-slate-600" />
              <h3 className="text-base font-semibold text-slate-900">Lịch sử ca làm trong ngày</h3>
            </div>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myAttendance.shifts.map((shift) => {
                    const hasIn = Boolean(shift.checkIn)
                    const hasOut = Boolean(shift.checkOut)
                    const statusText = hasOut ? 'Hoàn thành' : hasIn ? 'Đang làm' : 'Chưa bắt đầu'
                    const statusClass = hasOut ? 'bg-green-50 text-green-700' : hasIn ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                    return (
                      <tr key={shift.mpcl}>
                        <td className="px-6 py-3 font-medium text-slate-800">{shift.shiftName || `Ca #${shift.shiftId}`}</td>
                        <td className="px-6 py-3 text-slate-600">{shift.startTime || '--:--'} - {shift.endTime || '--:--'}</td>
                        <td className="px-6 py-3 text-slate-600">{hasIn ? new Date(shift.checkIn).toLocaleTimeString('vi-VN') : '-'}</td>
                        <td className="px-6 py-3 text-slate-600">{hasOut ? new Date(shift.checkOut).toLocaleTimeString('vi-VN') : '-'}</td>
                        <td className="px-6 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{statusText}</span>
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

  // Quản lý: có tabs
  return (
    <div className="space-y-6">
      {/* Modal thông báo */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${modal.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
              {modal.type === 'success'
                ? <CheckCircle2Icon className="h-7 w-7 text-green-600" />
                : <AlertCircleIcon className="h-7 w-7 text-red-500" />
              }
            </div>
            <p className="text-center text-base font-semibold text-gray-900 mb-1">
              {modal.type === 'success' ? 'Thành công' : 'Có lỗi xảy ra'}
            </p>
            <p className="text-center text-sm text-gray-500 mb-5">{modal.message}</p>
            <button
              type="button"
              onClick={closeModal}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-colors ${modal.type === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
      <div className="flex gap-2 border-b mb-4">
        <button
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${tab === 'attendance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
          onClick={() => { setTab('attendance'); loadShiftAssignments(shiftDate); }}
        >
          Chấm công
        </button>
        <button
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${tab === 'shift' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'}`}
          onClick={() => { setTab('shift'); loadShiftAssignments(); }}
        >
          Phân ca
        </button>
      </div>

      {tab === 'attendance' ? (
        // --- CHẤM CÔNG UI ---
        <section className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Chấm công</h2>
              <p className="mt-0.5 text-sm text-gray-400">Ngày: {formatDateVN(selectedDate)}</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="date" value={selectedDate} onChange={e => handleDateChange(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
              <button type="button" onClick={handleReloadToday} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><RefreshCcwIcon className="h-4 w-4" />Hôm nay</button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 px-5 py-4 border-b border-gray-100">
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Tổng nhân viên</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{rows.length}</p>
            </div>
            <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3">
              <p className="text-xs text-green-700">Có mặt</p>
              <p className="mt-1 text-xl font-semibold text-green-800">{presentCount}</p>
            </div>
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-xs text-red-600">Vắng</p>
              <p className="mt-1 text-xl font-semibold text-red-700">{rows.length - presentCount}</p>
            </div>
          </div>

          {/* Thông báo hiển thị qua modal */}

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-sm text-gray-400">Đang tải dữ liệu...</div>
            ) : rows.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">Không có dữ liệu chấm công.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Nhân viên</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Chức vụ</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ca làm — bấm để chấm công</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((item) => {
                    const mnv = Number(item.mnv)
                    const name = item.fullName || item.HOTEN || '-'
                    const initials = name.split(' ').filter(Boolean).slice(-2).map((w: string) => w[0]).join('').toUpperCase()
                    const empShiftIds = shiftAssignmentsByEmployee[mnv] || []
                    const empShifts = shiftDefinitions.filter(s => empShiftIds.includes(s.mca))
                    const isPresent = Boolean(presentMap[mnv])
                    return (
                      <tr key={mnv} className="hover:bg-gray-50/60 transition-colors align-middle">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{name}</p>
                              <p className="text-[11px] text-gray-400">MNV-{String(mnv).padStart(3,'0')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 text-sm">{item.positionName || item.TENCHUCVU || 'Chưa cập nhật'}</td>
                        <td className="px-5 py-3.5">
                          {empShifts.length === 0 ? (
                            <span className="text-xs text-gray-300 italic">Chưa phân ca</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {empShifts.map(shift => {
                                const isCheckedIn = Boolean(presentMap[mnv])
                                return (
                                  <button
                                    key={shift.mca}
                                    type="button"
                                    disabled={saving || shiftLoading}
                                    onClick={async () => {
                                      setSaving(true)
                                      setError('')
                                      try {
                                        await checkInAttendanceApi({ date: selectedDate, employeeId: mnv, shiftId: shift.mca })
                                        await loadAttendance(selectedDate, { silent: true })
                                      } catch (e) {
                                        const msg = e?.message || 'Không thể chấm công'
                                        setError(msg)
                                        showModal('error', msg)
                                      } finally { setSaving(false) }
                                    }}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all disabled:opacity-50 ${
                                      isCheckedIn
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700'
                                    }`}
                                  >
                                    {isCheckedIn && <CheckCircle2Icon className="h-3 w-3" />}
                                    <span>{shift.shiftName || `Ca #${shift.mca}`}</span>
                                    <span className="opacity-60">{shift.startTime || '--:--'}–{shift.endTime || '--:--'}</span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {isPresent
                            ? <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-green-700"><CheckCircle2Icon className="h-3 w-3" />Đúng giờ</span>
                            : empShifts.length === 0
                              ? <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">Chưa ca</span>
                              : <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-600">Chưa vào</span>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      ) : (
        // --- PHÂN CA UI ---
        <section className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Phân ca làm việc</h2>
              <p className="mt-0.5 text-sm text-gray-400">Ngày: {formatDateVN(shiftDate)}</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="date" value={shiftDate} onChange={e => handleShiftDateChange(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
              <button type="button" onClick={() => loadShiftAssignments()} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><RefreshCcwIcon className="h-4 w-4" />Làm mới</button>
              <button type="button" onClick={handleShiftSave} disabled={shiftSaving || shiftLoading} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"><SaveIcon className="h-4 w-4" />{shiftSaving ? 'Đang lưu...' : 'Lưu'}</button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 px-5 py-4 border-b border-gray-100">
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Tổng nhân viên</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{shiftEmployees.length}</p>
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

          {/* Thông báo hiển thị qua modal */}

          {/* Table */}
          <div className="overflow-x-auto">
            {shiftLoading ? (
              <div className="py-16 text-center text-sm text-gray-400">Đang tải dữ liệu...</div>
            ) : shiftEmployees.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">Không có dữ liệu phân ca.</div>
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
                  {shiftEmployees.map(emp => {
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
                      </tr                >
                    )
                  })}
                </tbody>
              </table>
            )}                    
          </div>
        </section>
      )}
    </div>
  )
}