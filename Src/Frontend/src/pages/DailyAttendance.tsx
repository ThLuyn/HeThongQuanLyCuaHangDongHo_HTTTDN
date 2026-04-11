//   // Địa chỉ cửa hàng và toạ độ
//   const STORE_LOCATIONS = [
//     {
//       name: '273 An Dương Vương, phường Chợ Quán, TP.HCM',
//       lat: 10.755013,
//       lng: 106.677964,
//     },
//     {
//       name: '35A Tân Trang, Phường Tân Hòa, TP.HCM',
//       lat: 10.790225,
//       lng: 106.658393,
//     },
//   ]

//   // Wifi SSID hợp lệ (nếu có thể kiểm tra)
//   const VALID_WIFI_NAMES = ['CuaHangDongHo', 'DongHo273', 'DongHo35A']

//   // Trạng thái xác thực GPS/Wifi
//   const [gpsStatus, setGpsStatus] = useState({ checked: false, valid: false, address: '', distance: null, error: '' })
//   const [wifiStatus, setWifiStatus] = useState({ checked: false, valid: false, ssid: '', error: '' })

//   // Hàm tính khoảng cách giữa 2 toạ độ (Haversine)
//   function getDistanceKm(lat1, lng1, lat2, lng2) {
//     const R = 6371
//     const dLat = ((lat2 - lat1) * Math.PI) / 180
//     const dLng = ((lng2 - lng1) * Math.PI) / 180
//     const a =
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLng / 2) * Math.sin(dLng / 2)
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
//     return R * c
//   }

//   // Kiểm tra GPS
//   const checkGPS = () => {
//     setGpsStatus({ checked: true, valid: false, address: '', distance: null, error: '' })
//     if (!navigator.geolocation) {
//       setGpsStatus({ checked: true, valid: false, address: '', distance: null, error: 'Trình duyệt không hỗ trợ GPS' })
//       return
//     }
//     navigator.geolocation.getCurrentPosition(
//       (pos) => {
//         const { latitude, longitude } = pos.coords
//         let found = false
//         let minDist = 9999
//         let best = null
//         for (const loc of STORE_LOCATIONS) {
//           const dist = getDistanceKm(latitude, longitude, loc.lat, loc.lng)
//           if (dist < 0.15) { // 150m
//             found = true
//             minDist = dist
//             best = loc
//             break
//           }
//           if (dist < minDist) {
//             minDist = dist
//             best = loc
//           }
//         }
//         setGpsStatus({ checked: true, valid: found, address: best ? best.name : '', distance: minDist, error: found ? '' : 'Bạn không ở gần cửa hàng' })
//       },
//       (err) => {
//         setGpsStatus({ checked: true, valid: false, address: '', distance: null, error: 'Không lấy được vị trí GPS' })
//       },
//       { enableHighAccuracy: true, timeout: 10000 }
//     )
//   }

//   // Kiểm tra Wifi (chỉ hỗ trợ trên mobile/android, hoặc nhập tay)
//   const checkWifi = () => {
//     setWifiStatus({ checked: true, valid: false, ssid: '', error: '' })
//     // navigator.connection không cung cấp SSID, chỉ có thể nhập tay hoặc dùng app native
//     const ssid = window.prompt('Nhập tên Wifi bạn đang kết nối (SSID):')
//     if (!ssid) {
//       setWifiStatus({ checked: true, valid: false, ssid: '', error: 'Không nhập tên Wifi' })
//       return
//     }
//     const valid = VALID_WIFI_NAMES.some((name) => ssid.toLowerCase().includes(name.toLowerCase()))
//     setWifiStatus({ checked: true, valid, ssid, error: valid ? '' : 'Wifi không hợp lệ' })
//   }
// // @ts-nocheck
// import { AlertCircleIcon, CheckCircle2Icon, Clock3Icon, HistoryIcon, LogInIcon, LogOutIcon, MapPinIcon, RefreshCcwIcon, SaveIcon, WifiIcon } from 'lucide-react'
// import { useEffect, useMemo, useState } from 'react'
// import { loadAuthSession } from '../utils/authStorage'
// import { checkInAttendanceApi, checkOutAttendanceApi, getEmployeesApi, getMyAttendanceStatusApi, getShiftAssignmentsApi, getTodayAttendanceApi, saveShiftAssignmentsApi } from '../utils/backendApi'

// function getVietnamTodayString() {
//   return new Intl.DateTimeFormat('en-CA', {
//     timeZone: 'Asia/Ho_Chi_Minh',
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit',
//   }).format(new Date())
// }

// function getDelayUntilNextVietnamMidnight() {
//   const nowText = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })
//   const vnNow = new Date(nowText)
//   const nextMidnight = new Date(vnNow)
//   nextMidnight.setHours(24, 0, 2, 0)
//   return Math.max(1000, nextMidnight.getTime() - vnNow.getTime())
// }

// export function DailyAttendance({ viewMode = 'auto' }) {
//   const currentSession = loadAuthSession()
//   const currentRole = String(currentSession?.role || '').toLowerCase()
//   const isStaffMode = viewMode === 'self' || (viewMode !== 'manage' && currentRole === 'staff')
//   const [loading, setLoading] = useState(false)
//   const [saving, setSaving] = useState(false)
//   const [error, setError] = useState('')
//   const [success, setSuccess] = useState('')
//   const [attendanceDate, setAttendanceDate] = useState('')
//   const [selectedDate, setSelectedDate] = useState(getVietnamTodayString())
//   const [currentTime, setCurrentTime] = useState(new Date())
//   const [manageTab, setManageTab] = useState('attendance')
//   const [rows, setRows] = useState([])
//   const [presentMap, setPresentMap] = useState({})
//   const [shiftLoading, setShiftLoading] = useState(false)
//   const [shiftSaving, setShiftSaving] = useState(false)
//   const [shiftDefinitions, setShiftDefinitions] = useState([])
//   const [shiftEmployees, setShiftEmployees] = useState([])
//   const [shiftAssignmentsByEmployee, setShiftAssignmentsByEmployee] = useState({})
//   const [myAttendance, setMyAttendance] = useState({
//     hasShift: false,
//     canCheckIn: false,
//     canCheckOut: false,
//     shifts: [],
//   })

//   const loadAttendance = async (dateOverride?: string, options?: { silent?: boolean }) => {
//     const requestDate = String(dateOverride || selectedDate || '').trim()
//     const isSilent = Boolean(options?.silent)
//     if (!isSilent) {
//       setLoading(true)
//       setError('')
//     }
//     try {
//       if (isStaffMode) {
//         const data = await getMyAttendanceStatusApi(requestDate || undefined)
//         const responseDate = String(data?.date || '').slice(0, 10)
//         setRows([])
//         setPresentMap({})
//         setMyAttendance({
//           hasShift: Boolean(data?.hasShift),
//           canCheckIn: Boolean(data?.canCheckIn),
//           canCheckOut: Boolean(data?.canCheckOut),
//           shifts: Array.isArray(data?.shifts) ? data.shifts : [],
//         })
//         setAttendanceDate(responseDate)
//         setSelectedDate(responseDate)
//       }
//       else {
//         const data = await getTodayAttendanceApi(requestDate || undefined)
//         const employees = Array.isArray(data?.employees) ? data.employees : []
//         const mapped = employees.reduce((acc, item) => {
//           acc[Number(item.mnv)] = Boolean(item.present)
//           return acc
//         }, {})

//         setRows(employees)
//         const responseDate = String(data?.date || '').slice(0, 10)
//         setAttendanceDate(responseDate)
//         setSelectedDate(responseDate)
//         setPresentMap(mapped)
//       }

//     } catch (e) {
//       const message = e instanceof Error ? e.message : 'Không thể tải dữ liệu chấm công hôm nay'
//       setError(message)
//     } finally {
//       if (!isSilent) {
//         setLoading(false)
//       }
//     }
//   }

//   const loadShiftAssignments = async (dateOverride?: string, options?: { silent?: boolean }) => {
//     const requestDate = String(dateOverride || selectedDate || '').trim()
//     const isSilent = Boolean(options?.silent)
//     if (!isSilent) {
//       setShiftLoading(true)
//       setError('')
//     }

//     try {
//       const [employeesData, shiftData] = await Promise.all([
//         getEmployeesApi(),
//         getShiftAssignmentsApi(requestDate || undefined),
//       ])

//       const activeEmployees = (Array.isArray(employeesData) ? employeesData : [])
//         .filter((item) => Number(item?.TT) === 1)
//         .map((item) => ({
//           mnv: Number(item.MNV),
//           fullName: item.HOTEN,
//           positionName: item.TENCHUCVU || null,
//         }))

//       const assignmentMap = (Array.isArray(shiftData?.assignments) ? shiftData.assignments : []).reduce((acc, item) => {
//         const employeeId = Number(item?.mnv)
//         const shiftId = Number(item?.shiftId)
//         if (!Number.isInteger(employeeId) || employeeId <= 0 || !Number.isInteger(shiftId) || shiftId <= 0) {
//           return acc
//         }
//         const current = Array.isArray(acc[employeeId]) ? acc[employeeId] : []
//         if (!current.includes(shiftId)) {
//           acc[employeeId] = [...current, shiftId]
//         }
//         return acc
//       }, {})

//       activeEmployees.forEach((item) => {
//         if (!Array.isArray(assignmentMap[item.mnv])) {
//           assignmentMap[item.mnv] = []
//         }
//       })

//       const responseDate = String(shiftData?.date || '').slice(0, 10)
//       setAttendanceDate(responseDate)
//       setSelectedDate(responseDate)
//       setShiftEmployees(activeEmployees)
//       setShiftDefinitions(Array.isArray(shiftData?.shifts) ? shiftData.shifts : [])
//       setShiftAssignmentsByEmployee(assignmentMap)
//     } catch (e) {
//       const message = e instanceof Error ? e.message : 'Không thể tải dữ liệu phân ca làm việc'
//       setError(message)
//     } finally {
//       if (!isSilent) {
//         setShiftLoading(false)
//       }
//     }
//   }

//   useEffect(() => {
//     const timer = window.setInterval(() => setCurrentTime(new Date()), 1000)
//     return () => window.clearInterval(timer)
//   }, [])

//   useEffect(() => {
//     if (isStaffMode) {
//       loadAttendance()
//       return
//     }

//     if (manageTab === 'shift') {
//       loadShiftAssignments()
//       return
//     }

//     loadAttendance()
//   }, [isStaffMode, manageTab])

//   useEffect(() => {
//     let midnightTimer: number | null = null

//     const scheduleNextMidnightReload = () => {
//       midnightTimer = window.setTimeout(async () => {
//         const nextDate = getVietnamTodayString()
//         setSelectedDate(nextDate)
//         if (isStaffMode || manageTab === 'attendance') {
//           await loadAttendance(nextDate)
//         } else {
//           await loadShiftAssignments(nextDate)
//         }
//         scheduleNextMidnightReload()
//       }, getDelayUntilNextVietnamMidnight())
//     }

//     scheduleNextMidnightReload()

//     return () => {
//       if (midnightTimer) {
//         window.clearTimeout(midnightTimer)
//       }
//     }
//   }, [isStaffMode, manageTab])

//   useEffect(() => {
//     if (!isStaffMode && manageTab !== 'attendance') {
//       return
//     }

//     const interval = window.setInterval(() => {
//       if (saving) {
//         return
//       }
//       const targetDate = selectedDate || attendanceDate || undefined
//       loadAttendance(targetDate, { silent: true })
//     }, 3000)

//     return () => {
//       window.clearInterval(interval)
//     }
//   }, [selectedDate, attendanceDate, saving, isStaffMode, manageTab])

//   useEffect(() => {
//     if (!success) {
//       return
//     }
//     const timer = window.setTimeout(() => setSuccess(''), 5000)
//     return () => window.clearTimeout(timer)
//   }, [success])

//   const presentCount = useMemo(
//     () => rows.reduce((count, item) => count + (presentMap[Number(item.mnv)] ? 1 : 0), 0),
//     [rows, presentMap],
//   )

//   const allChecked = rows.length > 0 && rows.every((item) => presentMap[Number(item.mnv)])






//   const handleToggleShift = (employeeId, shiftId, checked) => {
//     const targetEmployeeId = Number(employeeId)
//     const targetShiftId = Number(shiftId)

//     if (!Number.isInteger(targetEmployeeId) || !Number.isInteger(targetShiftId)) {
//       return
//     }

//     setShiftAssignmentsByEmployee((prev) => {
//       const currentShiftIds = Array.isArray(prev[targetEmployeeId]) ? prev[targetEmployeeId] : []
//       const nextShiftIds = checked
//         ? Array.from(new Set([...currentShiftIds, targetShiftId]))
//         : currentShiftIds.filter((item) => Number(item) !== targetShiftId)

//       return {
//         ...prev,
//         [targetEmployeeId]: nextShiftIds,
//       }
//     })
//   }

//   const handleSaveShiftAssignments = async () => {
//     if (isStaffMode) {
//       return
//     }

//     const targetDate = selectedDate || attendanceDate || getVietnamTodayString()
//     const payloadAssignments = shiftEmployees.map((employee) => ({
//       employeeId: Number(employee.mnv),
//       shiftIds: Array.isArray(shiftAssignmentsByEmployee[Number(employee.mnv)])
//         ? shiftAssignmentsByEmployee[Number(employee.mnv)]
//         : [],
//     }))

//     setShiftSaving(true)
//     setError('')
//     try {
//       const result = await saveShiftAssignmentsApi({
//         date: targetDate,
//         assignments: payloadAssignments,
//       })
//       setSuccess(`Đã lưu phân ca ngày ${new Date(result.date).toLocaleDateString('vi-VN')} (${result.assignedCount} ca làm)`)
//       await loadShiftAssignments(targetDate)
//     } catch (e) {
//       const message = e instanceof Error ? e.message : 'Không thể lưu phân ca làm việc'
//       setError(message)
//     } finally {
//       setShiftSaving(false)
//     }
//   }

//   const handleCheckIn = async () => {
//     const targetDate = selectedDate || attendanceDate || getVietnamTodayString()
//     setSaving(true)
//     setError('')
//     try {
//       await checkInAttendanceApi({ date: targetDate })
//       setSuccess(`Check-in thành công ngày ${new Date(targetDate).toLocaleDateString('vi-VN')}`)
//       await loadAttendance(targetDate)
//     } catch (e) {
//       const message = e instanceof Error ? e.message : 'Không thể check-in'
//       setError(message)
//     } finally {
//       setSaving(false)
//     }
//   }

//   const handleCheckOut = async () => {
//     const targetDate = selectedDate || attendanceDate || getVietnamTodayString()
//     setSaving(true)
//     setError('')
//     try {
//       await checkOutAttendanceApi({ date: targetDate })
//       setSuccess(`Ra ca thành công ngày ${new Date(targetDate).toLocaleDateString('vi-VN')}`)
//       await loadAttendance(targetDate)
//     } catch (e) {
//       const message = e instanceof Error ? e.message : 'Không thể ra ca'
//       setError(message)
//     } finally {
//       setSaving(false)
//     }
//   }

//   const handleDateChange = (value: string) => {
//     const nextDate = String(value || '').trim()
//     setSelectedDate(nextDate)
//     if (nextDate) {
//       if (isStaffMode || manageTab === 'attendance') {
//         loadAttendance(nextDate)
//       } else {
//         loadShiftAssignments(nextDate)
//       }
//     }
//   }

//   const handleReloadToday = () => {
//     const today = getVietnamTodayString()
//     setSelectedDate(today)
//     if (isStaffMode || manageTab === 'attendance') {
//       loadAttendance(today)
//     } else {
//       loadShiftAssignments(today)
//     }
//   }

//   const assignedEmployeeCount = useMemo(
//     () => shiftEmployees.filter((item) => Array.isArray(shiftAssignmentsByEmployee[Number(item.mnv)]) && shiftAssignmentsByEmployee[Number(item.mnv)].length > 0).length,
//     [shiftEmployees, shiftAssignmentsByEmployee],
//   )

//   const assignedShiftCount = useMemo(
//     () => shiftEmployees.reduce((sum, item) => sum + (Array.isArray(shiftAssignmentsByEmployee[Number(item.mnv)]) ? shiftAssignmentsByEmployee[Number(item.mnv)].length : 0), 0),
//     [shiftEmployees, shiftAssignmentsByEmployee],
//   )

//   if (isStaffMode) {
//     const currentDateDisplay = attendanceDate
//       ? new Date(attendanceDate).toLocaleDateString('vi-VN')
//       : 'Hôm nay'
//     const isAlreadyCheckedIn = myAttendance.shifts.some((shift) => Boolean(shift.checkIn))
//     const checkInDisabledReason = !myAttendance.hasShift
//       ? 'Bạn chưa có ca làm trong ngày đã chọn'
//       : loading
//         ? 'Đang tải dữ liệu ca làm'
//         : saving
//           ? 'Đang xử lý thao tác chấm công'
//           : !myAttendance.canCheckIn
//             ? 'Bạn đã check-in đủ các ca trong ngày'
//             : ''
//     const checkOutDisabledReason = !myAttendance.hasShift
//       ? 'Bạn chưa có ca làm trong ngày đã chọn'
//       : loading
//         ? 'Đang tải dữ liệu ca làm'
//         : saving
//           ? 'Đang xử lý thao tác chấm công'
//           : !myAttendance.canCheckOut
//             ? 'Bạn cần check-in trước khi ra ca, hoặc đã ra ca đủ'
//             : ''

//     return (
//       <div className="space-y-6">
//         {error ? (
//           <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
//         ) : null}

//         {success ? (
//           <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
//         ) : null}

//         <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
//           <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
//             <div className="space-y-6 border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">
//               <div>
//                 <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
//                   <Clock3Icon className="h-3.5 w-3.5" />
//                   Trạng thái hiện tại
//                 </span>
//                 <p className="mt-4 text-4xl font-bold tracking-tight text-slate-800 lg:text-5xl">
//                   {currentTime.toLocaleTimeString('vi-VN', { hour12: false })}
//                 </p>
//                 <p className="mt-2 text-sm text-slate-500">Ngày chấm công: {currentDateDisplay}</p>
//               </div>

//               <div className="flex flex-wrap items-center gap-2">
//                 <input
//                   type="date"
//                   value={selectedDate}
//                   onChange={(e) => handleDateChange(e.target.value)}
//                   className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
//                 />
//                 <button
//                   type="button"
//                   onClick={handleReloadToday}
//                   className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
//                 >
//                   <RefreshCcwIcon className="h-4 w-4" />
//                   Làm mới
//                 </button>
//               </div>

//               <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
//                 <button
//                   type="button"
//                   onClick={handleCheckIn}
//                   disabled={saving || loading || !myAttendance.canCheckIn}
//                   title={checkInDisabledReason || 'Check-in vào ca'}
//                   className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2ECC71] px-4 py-3 text-sm font-semibold text-white hover:bg-[#29b765] disabled:opacity-60"
//                 >
//                   <LogInIcon className="h-4 w-4" />
//                   {saving ? 'Đang xử lý...' : 'Vào ca'}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleCheckOut}
//                   disabled={saving || loading || !myAttendance.canCheckOut}
//                   title={checkOutDisabledReason || 'Check-out ra ca'}
//                   className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF4D6D] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e64462] disabled:opacity-60"
//                 >
//                   <LogOutIcon className="h-4 w-4" />
//                   {saving ? 'Đang xử lý...' : 'Ra ca'}
//                 </button>
//               </div>
//               {checkInDisabledReason || checkOutDisabledReason ? (
//                 <p className="text-xs text-slate-500">
//                   {checkInDisabledReason || checkOutDisabledReason}
//                 </p>
//               ) : null}
//             </div>

//             <div className="space-y-4 bg-slate-50 p-6">
//               <h3 className="text-sm font-semibold text-slate-800">Xác thực điều kiện</h3>
//               {/* 1. Ca làm trong ngày */}
//               <div className="rounded-xl border border-slate-200 bg-white p-3 mb-2">
//                 <div className="flex items-start gap-3">
//                   <div className={`rounded-lg p-2 ${myAttendance.hasShift ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
//                     <MapPinIcon className="h-4 w-4" />
//                   </div>
//                   <div className="flex-1">
//                     <p className="text-sm font-semibold text-slate-700">Ca làm trong ngày</p>
//                     <p className={`text-xs ${myAttendance.hasShift ? 'text-green-600' : 'text-red-500'}`}>
//                       {myAttendance.hasShift ? 'Đã có phân ca làm việc' : 'Chưa có ca làm hôm nay'}
//                     </p>
//                   </div>
//                   {myAttendance.hasShift ? <CheckCircle2Icon className="mt-0.5 h-4 w-4 text-green-500" /> : <AlertCircleIcon className="mt-0.5 h-4 w-4 text-red-400" />}
//                 </div>
//               </div>
//               {/* 2. GPS đúng vị trí */}
//               <div className="rounded-xl border border-slate-200 bg-white p-3 mb-2">
//                 <div className="flex items-start gap-3">
//                   <div className={`rounded-lg p-2 ${gpsStatus.checked ? (gpsStatus.valid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600') : 'bg-slate-100 text-slate-600'}`}>
//                     <MapPinIcon className="h-4 w-4" />
//                   </div>
//                   <div className="flex-1">
//                     <p className="text-sm font-semibold text-slate-700">GPS tại cửa hàng</p>
//                     <p className={`text-xs ${gpsStatus.checked ? (gpsStatus.valid ? 'text-green-600' : 'text-red-500') : 'text-slate-500'}`}>
//                       {gpsStatus.checked
//                         ? gpsStatus.valid
//                           ? `Đúng vị trí: ${gpsStatus.address}`
//                           : gpsStatus.error || 'Không đúng vị trí cửa hàng'
//                         : 'Cần xác thực vị trí GPS'}
//                     </p>
//                     {gpsStatus.checked && gpsStatus.distance !== null && (
//                       <p className="text-xs text-slate-400">Khoảng cách: {gpsStatus.distance.toFixed(2)} km</p>
//                     )}
//                   </div>
//                   <button type="button" onClick={checkGPS} className="rounded px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100">Kiểm tra GPS</button>
//                   {gpsStatus.checked ? (
//                     gpsStatus.valid ? <CheckCircle2Icon className="mt-0.5 h-4 w-4 text-green-500" /> : <AlertCircleIcon className="mt-0.5 h-4 w-4 text-red-400" />
//                   ) : null}
//                 </div>
//               </div>
//               {/* 3. Wifi đúng cửa hàng */}
//               <div className="rounded-xl border border-slate-200 bg-white p-3">
//                 <div className="flex items-start gap-3">
//                   <div className={`rounded-lg p-2 ${wifiStatus.checked ? (wifiStatus.valid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600') : 'bg-slate-100 text-slate-600'}`}>
//                     <WifiIcon className="h-4 w-4" />
//                   </div>
//                   <div className="flex-1">
//                     <p className="text-sm font-semibold text-slate-700">Kết nối Wifi cửa hàng</p>
//                     <p className={`text-xs ${wifiStatus.checked ? (wifiStatus.valid ? 'text-green-600' : 'text-red-500') : 'text-slate-500'}`}>
//                       {wifiStatus.checked
//                         ? wifiStatus.valid
//                           ? `Đã xác thực Wifi: ${wifiStatus.ssid}`
//                           : wifiStatus.error || 'Không đúng Wifi cửa hàng'
//                         : 'Cần xác thực Wifi'}
//                     </p>
//                   </div>
//                   <button type="button" onClick={checkWifi} className="rounded px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100">Kiểm tra Wifi</button>
//                   {wifiStatus.checked ? (
//                     wifiStatus.valid ? <CheckCircle2Icon className="mt-0.5 h-4 w-4 text-green-500" /> : <AlertCircleIcon className="mt-0.5 h-4 w-4 text-red-400" />
//                   ) : null}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
//           <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
//             <div className="flex items-center gap-2">
//               <HistoryIcon className="h-5 w-5 text-slate-600" />
//               <h3 className="text-base font-semibold text-slate-900">Lịch sử ca làm trong ngày</h3>
//             </div>
//           </div>
//           {!myAttendance.hasShift ? (
//             <div className="px-6 py-5 text-sm text-slate-500">Không có ca làm trong ngày đã chọn.</div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full text-left text-sm">
//                 <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
//                   <tr>
//                     <th className="px-6 py-3">Ca</th>
//                     <th className="px-6 py-3">Khung giờ</th>
//                     <th className="px-6 py-3">Vào ca</th>
//                     <th className="px-6 py-3">Ra ca</th>
//                     <th className="px-6 py-3">Trạng thái</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100">
//                   {myAttendance.shifts.map((shift) => {
//                     const hasIn = Boolean(shift.checkIn)
//                     const hasOut = Boolean(shift.checkOut)
//                     const statusText = hasOut ? 'Hoàn thành' : hasIn ? 'Đang làm' : 'Chưa bắt đầu'
//                     const statusClass = hasOut ? 'bg-green-50 text-green-700' : hasIn ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
//                     return (
//                       <tr key={shift.mpcl}>
//                         <td className="px-6 py-3 font-medium text-slate-800">{shift.shiftName || `Ca #${shift.shiftId}`}</td>
//                         <td className="px-6 py-3 text-slate-600">{shift.startTime || '--:--'} - {shift.endTime || '--:--'}</td>
//                         <td className="px-6 py-3 text-slate-600">{hasIn ? new Date(shift.checkIn).toLocaleTimeString('vi-VN') : '-'}</td>
//                         <td className="px-6 py-3 text-slate-600">{hasOut ? new Date(shift.checkOut).toLocaleTimeString('vi-VN') : '-'}</td>
//                         <td className="px-6 py-3">
//                           <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{statusText}</span>
//                         </td>
//                       </tr>
//                     )
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </section>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-5">
//       {error ? (
//         <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
//       ) : null}

//       {success ? (
//         <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
//       ) : null}

//       <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//         <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-4">
//           <div className="flex flex-wrap items-start justify-between gap-4">
//             <div>
//               <h2 className="text-lg font-semibold text-slate-900">Chấm công & Phân ca</h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 Ngày chấm công: {attendanceDate ? new Date(attendanceDate).toLocaleDateString('vi-VN') : 'Hôm nay'}
//               </p>
//             </div>

//             <div className="flex flex-wrap items-center gap-2">
//               <input
//                 type="date"
//                 value={selectedDate}
//                 onChange={(e) => handleDateChange(e.target.value)}
//                 className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold-400/50"
//               />
//               <button
//                 type="button"
//                 onClick={handleReloadToday}
//                 className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
//               >
//                 <RefreshCcwIcon className="h-4 w-4" />
//                 Làm mới
//               </button>
//               {manageTab === 'attendance' ? null : (
//                 <button
//                   type="button"
//                   onClick={handleSaveShiftAssignments}
//                   disabled={shiftSaving || shiftLoading}
//                   className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
//                 >
//                   <SaveIcon className="h-4 w-4" />
//                   {shiftSaving ? 'Đang lưu...' : 'Lưu'}
//                 </button>
//               )}
//             </div>
//           </div>

//           <div className="mt-4 flex items-end gap-1 border-b border-slate-200/80">
//             <button
//               type="button"
//               onClick={() => setManageTab('attendance')}
//               className={`inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${manageTab === 'attendance' ? 'bg-white text-gold-700 ring-1 ring-inset ring-slate-200 border-b-2 border-gold-500' : 'text-slate-500 hover:text-slate-800'}`}
//             >
//               <CheckCircle2Icon className="h-4 w-4" />
//               Chấm công
//             </button>
//             <button
//               type="button"
//               onClick={() => setManageTab('shift')}
//               className={`inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${manageTab === 'shift' ? 'bg-white text-gold-700 ring-1 ring-inset ring-slate-200 border-b-2 border-gold-500' : 'text-slate-500 hover:text-slate-800'}`}
//             >
//               <MapPinIcon className="h-4 w-4" />
//               Phân ca
//             </button>
//           </div>
//         </div>

//         <div className="space-y-4 p-5">
//           {manageTab === 'attendance' ? (
//             <>
//               <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
//                 <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
//                   <p className="text-xs text-gray-500">Tổng nhân viên</p>
//                   <p className="mt-1 text-xl font-semibold text-gray-900">{rows.length}</p>
//                 </div>
//                 <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
//                   <p className="text-xs text-emerald-700">Có mặt</p>
//                   <p className="mt-1 text-xl font-semibold text-emerald-800">{presentCount}</p>
//                 </div>
//                 <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3">
//                   <p className="text-xs text-rose-700">Vắng</p>
//                   <p className="mt-1 text-xl font-semibold text-rose-800">{Math.max(0, rows.length - presentCount)}</p>
//                 </div>
//               </div>

//               <div className="rounded-xl border border-gray-100 bg-white p-4">
//                 <div className="mb-3 flex items-center justify-between gap-3">
//                   <h3 className="text-base font-semibold text-gray-900">Danh sách nhân viên</h3>

//                 </div>

//                 {loading ? (
//                   <div className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800">Đang tải dữ liệu nhân viên...</div>
//                 ) : rows.length === 0 ? (
//                   <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">Không có nhân viên để chấm công</div>
//                 ) : (
//                   <div className="space-y-2">
//                     {rows.map((item) => {
//                       const checked = Boolean(presentMap[Number(item.mnv)])
//                       return (
//                         <label
//                           key={Number(item.mnv)}
//                           className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 ${checked ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white'}`}
//                         >
//                           <div>
//                             <p className="text-sm font-medium text-gray-900">{item.fullName}</p>
//                             <p className="text-xs text-gray-500">NV{String(item.mnv).padStart(3, '0')} • {item.positionName || 'Chưa cập nhật chức vụ'}</p>
//                           </div>
//                           <div className="flex items-center gap-2">
//                             <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${checked ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
//                               {checked ? 'Có mặt' : 'Vắng'}
//                             </span>
//                           </div>
//                         </label>
//                       )
//                     })}
//                   </div>
//                 )}
//               </div>
//             </>
//           ) : (
//             <>
//               <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
//                 <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
//                   <p className="text-xs text-gray-500">Nhân viên đang làm</p>
//                   <p className="mt-1 text-xl font-semibold text-gray-900">{shiftEmployees.length}</p>
//                 </div>
//                 <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
//                   <p className="text-xs text-blue-700">Đã được phân ca</p>
//                   <p className="mt-1 text-xl font-semibold text-blue-800">{assignedEmployeeCount}</p>
//                 </div>
//                 <div className="rounded-lg border border-gold-200 bg-gold-50 px-4 py-3">
//                   <p className="text-xs text-gold-700">Tổng ca đã phân</p>
//                   <p className="mt-1 text-xl font-semibold text-gold-900">{assignedShiftCount}</p>
//                 </div>
//               </div>

//               <div className="rounded-xl border border-gray-100 bg-white p-4">
//                 <h3 className="mb-3 text-base font-semibold text-gray-900">Bảng phân ca theo ngày</h3>

//                 {shiftLoading ? (
//                   <div className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800">Đang tải dữ liệu phân ca...</div>
//                 ) : shiftDefinitions.length === 0 ? (
//                   <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">Chưa có ca làm hoạt động. Vui lòng cấu hình bảng CALAM trước khi phân ca.</div>
//                 ) : shiftEmployees.length === 0 ? (
//                   <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">Không có nhân viên đang làm để phân ca.</div>
//                 ) : (
//                   <div className="overflow-x-auto">
//                     <table className="min-w-full text-sm">
//                       <thead>
//                         <tr className="border-b border-gray-100 bg-gray-50 text-left text-gray-600">
//                           <th className="px-3 py-2 font-medium">Nhân viên</th>
//                           <th className="px-3 py-2 font-medium">Chức vụ</th>
//                           {shiftDefinitions.map((shift) => (
//                             <th key={Number(shift.mca)} className="px-3 py-2 text-center font-medium">
//                               <div className="text-sm text-gray-700">{shift.shiftName}</div>
//                               <div className="text-xs text-gray-500">{shift.startTime || '--:--'} - {shift.endTime || '--:--'}</div>
//                             </th>
//                           ))}
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {shiftEmployees.map((employee) => (
//                           <tr key={Number(employee.mnv)} className="border-b border-gray-50 last:border-0">
//                             <td className="px-3 py-2">
//                               <p className="font-medium text-gray-900">{employee.fullName}</p>
//                               <p className="text-xs text-gray-500">NV{String(employee.mnv).padStart(3, '0')}</p>
//                             </td>
//                             <td className="px-3 py-2 text-gray-600">{employee.positionName || 'Chưa cập nhật'}</td>
//                             {shiftDefinitions.map((shift) => {
//                               const assignedShiftIds = Array.isArray(shiftAssignmentsByEmployee[Number(employee.mnv)])
//                                 ? shiftAssignmentsByEmployee[Number(employee.mnv)]
//                                 : []
//                               const checked = assignedShiftIds.includes(Number(shift.mca))

//                               return (
//                                 <td key={`${employee.mnv}-${shift.mca}`} className="px-3 py-2 text-center">
//                                   <input
//                                     type="checkbox"
//                                     checked={checked}
//                                     onChange={(e) => handleToggleShift(employee.mnv, shift.mca, e.target.checked)}
//                                     disabled={shiftSaving || shiftLoading}
//                                     className="h-4 w-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
//                                   />
//                                 </td>
//                               )
//                             })}
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 )}
//               </div>
//             </>
//           )}
//         </div>
//       </section>
//     </div>
//   )
// }



// @ts-nocheck
import { AlertCircleIcon, CheckCircle2Icon, Clock3Icon, HistoryIcon, LogInIcon, LogOutIcon, MapPinIcon, RefreshCcwIcon, SaveIcon, WifiIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { loadAuthSession } from '../utils/authStorage'
import { checkInAttendanceApi, checkOutAttendanceApi, getEmployeesApi, getMyAttendanceStatusApi, getShiftAssignmentsApi, getTodayAttendanceApi, saveShiftAssignmentsApi } from '../utils/backendApi'

// --- HẰNG SỐ VÀ HÀM BỔ TRỢ ---
const STORE_LOCATIONS = [
  { name: '273 An Dương Vương, phường Chợ Quán, TP.HCM', lat: 10.755013, lng: 106.677964 },
  { name: '35A Tân Trang, Phường Tân Hòa, TP.HCM', lat: 10.790225, lng: 106.658393 },
]
const VALID_WIFI_NAMES = ['CuaHangDongHo', 'DongHo273', 'DongHo35A']

function getVietnamTodayString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export function DailyAttendance({ viewMode = 'auto' }) {
  const currentSession = loadAuthSession()
  const currentRole = String(currentSession?.role || '').toLowerCase()
  const isStaffMode = viewMode === 'self' || (viewMode !== 'manage' && currentRole === 'staff')
  
  // States
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [attendanceDate, setAttendanceDate] = useState('')
  const [selectedDate, setSelectedDate] = useState(getVietnamTodayString())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [manageTab, setManageTab] = useState('attendance')
  const [rows, setRows] = useState([])
  const [presentMap, setPresentMap] = useState({})
  const [shiftLoading, setShiftLoading] = useState(false)
  const [shiftSaving, setShiftSaving] = useState(false)
  const [shiftDefinitions, setShiftDefinitions] = useState([])
  const [shiftEmployees, setShiftEmployees] = useState([])
  const [shiftAssignmentsByEmployee, setShiftAssignmentsByEmployee] = useState({})
  const [gpsStatus, setGpsStatus] = useState({ checked: false, valid: false, address: '', distance: null, error: '' })
  const [wifiStatus, setWifiStatus] = useState({ checked: false, valid: false, ssid: '', error: '' })
  const [myAttendance, setMyAttendance] = useState({ hasShift: false, canCheckIn: false, canCheckOut: false, shifts: [] })

  // Logic GPS/Wifi
  const checkGPS = () => {
    setGpsStatus({ checked: true, valid: false, address: '', distance: null, error: '' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        let found = false; let minDist = 999; let best = null
        STORE_LOCATIONS.forEach(loc => {
          const dist = getDistanceKm(latitude, longitude, loc.lat, loc.lng)
          if (dist < 0.15) { found = true; best = loc; minDist = dist }
        })
        setGpsStatus({ checked: true, valid: found, address: best ? best.name : '', distance: minDist, error: found ? '' : 'Sai vị trí' })
      },
      () => setGpsStatus({ checked: true, valid: false, error: 'Lỗi GPS' })
    )
  }

  const checkWifi = () => {
    const ssid = window.prompt('Nhập tên Wifi (SSID):')
    if (!ssid) return
    const valid = VALID_WIFI_NAMES.some(n => ssid.toLowerCase().includes(n.toLowerCase()))
    setWifiStatus({ checked: true, valid, ssid, error: valid ? '' : 'Wifi sai' })
  }

  // Load Data
  const loadAttendance = async () => {
    setLoading(true)
    try {
      if (isStaffMode) {
        const data = await getMyAttendanceStatusApi(selectedDate)
        setMyAttendance({ hasShift: !!data?.hasShift, canCheckIn: !!data?.canCheckIn, canCheckOut: !!data?.canCheckOut, shifts: data?.shifts || [] })
      } else {
        const data = await getTodayAttendanceApi(selectedDate)
        const emps = data?.employees || []
        setRows(emps)
        setPresentMap(emps.reduce((acc, i) => ({ ...acc, [i.mnv]: i.present }), {}))
      }
    } catch (e) { setError('Lỗi tải dữ liệu') } finally { setLoading(false) }
  }

  const loadShiftAssignments = async () => {
    setShiftLoading(true)
    try {
      const [emps, shifts] = await Promise.all([getEmployeesApi(), getShiftAssignmentsApi(selectedDate)])
      setShiftEmployees(emps.filter(e => e.TT === 1).map(e => ({ mnv: e.MNV, fullName: e.HOTEN, positionName: e.TENCHUCVU })))
      setShiftDefinitions(shifts?.shifts || [])
      const map = (shifts?.assignments || []).reduce((acc, i) => {
        if(!acc[i.mnv]) acc[i.mnv] = []; acc[i.mnv].push(i.shiftId); return acc
      }, {})
      setShiftAssignmentsByEmployee(map)
    } catch (e) { setError('Lỗi phân ca') } finally { setShiftLoading(false) }
  }

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (manageTab === 'shift') loadShiftAssignments()
    else loadAttendance()
  }, [selectedDate, manageTab])

  const handleToggleShift = (eid, sid, checked) => {
    setShiftAssignmentsByEmployee(prev => {
      const curr = prev[eid] || []
      return { ...prev, [eid]: checked ? [...curr, sid] : curr.filter(id => id !== sid) }
    })
  }

  const handleSaveShift = async () => {
    setShiftSaving(true)
    try {
      const payload = shiftEmployees.map(e => ({ employeeId: e.mnv, shiftIds: shiftAssignmentsByEmployee[e.mnv] || [] }))
      await saveShiftAssignmentsApi({ date: selectedDate, assignments: payload })
      setSuccess('Lưu thành công')
    } catch (e) { setError('Lỗi lưu') } finally { setShiftSaving(false) }
  }

  const presentCount = useMemo(() => rows.filter(r => presentMap[r.mnv]).length, [rows, presentMap])

  // --- UI ---
  if (isStaffMode) {
    return (
      <div className="space-y-6">
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}
        {success && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">{success}</div>}
        <section className="bg-white rounded-3xl border shadow-sm grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
          <div className="p-6 border-r space-y-4">
            <h3 className="text-5xl font-bold text-slate-800">{currentTime.toLocaleTimeString('vi-VN')}</h3>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border p-2 rounded-lg w-full" />
            <div className="grid grid-cols-2 gap-4">
              <button onClick={async () => { await checkInAttendanceApi({date: selectedDate}); loadAttendance(); }} disabled={!myAttendance.canCheckIn} className="bg-green-500 text-white p-4 rounded-2xl font-bold disabled:opacity-50">Vào ca</button>
              <button onClick={async () => { await checkOutAttendanceApi({date: selectedDate}); loadAttendance(); }} disabled={!myAttendance.canCheckOut} className="bg-rose-500 text-white p-4 rounded-2xl font-bold disabled:opacity-50">Ra ca</button>
            </div>
          </div>
          <div className="p-6 bg-slate-50 space-y-4">
             <div className="bg-white p-3 rounded-xl border flex justify-between items-center">
                <div className="text-xs font-bold">📍 GPS: {gpsStatus.valid ? "Hợp lệ" : "Chưa xác thực"}</div>
                <button onClick={checkGPS} className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-[10px]">Quét</button>
             </div>
             <div className="bg-white p-3 rounded-xl border flex justify-between items-center">
                <div className="text-xs font-bold">📶 Wifi: {wifiStatus.valid ? wifiStatus.ssid : "Chưa xác thực"}</div>
                <button onClick={checkWifi} className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-[10px]">Quét</button>
             </div>
          </div>
        </section>
        <section className="bg-white rounded-3xl border shadow-sm p-4">
           <h3 className="font-bold mb-4">Lịch sử hôm nay</h3>
           <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr><th className="p-3 text-left">Ca</th><th className="p-3">Vào</th><th className="p-3">Ra</th></tr>
              </thead>
              <tbody>
                {myAttendance.shifts.map(s => (
                  <tr key={s.shiftId} className="border-t">
                    <td className="p-3 font-medium">{s.shiftName}</td>
                    <td className="p-3">{s.checkIn ? new Date(s.checkIn).toLocaleTimeString() : '-'}</td>
                    <td className="p-3">{s.checkOut ? new Date(s.checkOut).toLocaleTimeString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
           </table>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold">Quản lý Chấm công & Phân ca</h2>
          <div className="flex gap-2">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border p-2 rounded-lg text-sm" />
            {manageTab === 'shift' && <button onClick={handleSaveShift} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm"><SaveIcon size={16}/></button>}
          </div>
        </div>
        <div className="flex border-b">
          <button onClick={() => setManageTab('attendance')} className={`flex-1 p-3 font-bold ${manageTab === 'attendance' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400'}`}>CHẤM CÔNG</button>
          <button onClick={() => setManageTab('shift')} className={`flex-1 p-3 font-bold ${manageTab === 'shift' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400'}`}>PHÂN CA</button>
        </div>
        <div className="p-5">
          {manageTab === 'attendance' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-lg border"> Tổng: {rows.length} </div>
                <div className="p-3 bg-green-50 rounded-lg border"> Có mặt: {presentCount} </div>
                <div className="p-3 bg-rose-50 rounded-lg border"> Vắng: {rows.length - presentCount} </div>
              </div>
              <table className="w-full text-sm border">
                <thead className="bg-slate-50"><tr><th className="p-3 text-left">Nhân viên</th><th className="p-3 text-center">Trạng thái</th></tr></thead>
                <tbody>
                  {rows.map(item => (
                    <tr key={item.mnv} className="border-t">
                      <td className="p-3"><b>{item.fullName}</b> (NV{item.mnv})</td>
                      <td className="p-3 text-center"><span className={presentMap[item.mnv] ? "text-green-600" : "text-red-500"}>{presentMap[item.mnv] ? "CÓ MẶT" : "VẮNG"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-slate-50">
                  <tr><th className="p-3 text-left">Nhân viên</th>{shiftDefinitions.map(s => <th key={s.mca} className="p-3 text-center">{s.shiftName}</th>)}</tr>
                </thead>
                <tbody>
                  {shiftEmployees.map(emp => (
                    <tr key={emp.mnv} className="border-t">
                      <td className="p-3"><b>{emp.fullName}</b></td>
                      {shiftDefinitions.map(s => (
                        <td key={s.mca} className="p-3 text-center">
                          <input type="checkbox" checked={(shiftAssignmentsByEmployee[emp.mnv] || []).includes(s.mca)} onChange={e => handleToggleShift(emp.mnv, s.mca, e.target.checked)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}