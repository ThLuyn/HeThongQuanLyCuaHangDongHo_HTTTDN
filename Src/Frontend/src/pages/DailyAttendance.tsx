// @ts-nocheck
import { AlertCircleIcon, CheckCircle2Icon, Clock3Icon, HistoryIcon, LogInIcon, LogOutIcon, MapPinIcon, RefreshCcwIcon, SaveIcon, WifiIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { loadAuthSession } from '../utils/authStorage'
import { checkInAttendanceApi, checkOutAttendanceApi, getMyAttendanceStatusApi, getTodayAttendanceApi, saveTodayAttendanceApi } from '../utils/backendApi'

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
    if (isStaffMode) {
      return
    }
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
      await loadAttendance(selectedDate || attendanceDate)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể lưu chấm công hôm nay'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleCheckIn = async () => {
    const targetDate = selectedDate || attendanceDate || getVietnamTodayString()
    setSaving(true)
    setError('')
    try {
      await checkInAttendanceApi({ date: targetDate })
      setSuccess(`Check-in thành công ngày ${new Date(targetDate).toLocaleDateString('vi-VN')}`)
      await loadAttendance(targetDate)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể check-in'
      setError(message)
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
      await loadAttendance(targetDate)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể ra ca'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDateChange = (value: string) => {
    const nextDate = String(value || '').trim()
    setSelectedDate(nextDate)
    if (nextDate) {
      loadAttendance(nextDate)
    }
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

    return (
      <div className="space-y-6">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        {success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
        ) : null}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
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
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                />
                <button
                  type="button"
                  onClick={handleReloadToday}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCcwIcon className="h-4 w-4" />
                  Làm mới
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={saving || loading || !myAttendance.canCheckIn}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2ECC71] px-4 py-3 text-sm font-semibold text-white hover:bg-[#29b765] disabled:opacity-60"
                >
                  <LogInIcon className="h-4 w-4" />
                  {saving ? 'Đang xử lý...' : 'Vào ca'}
                </button>
                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={saving || loading || !myAttendance.canCheckOut}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF4D6D] px-4 py-3 text-sm font-semibold text-white hover:bg-[#e64462] disabled:opacity-60"
                >
                  <LogOutIcon className="h-4 w-4" />
                  {saving ? 'Đang xử lý...' : 'Ra ca'}
                </button>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 p-6">
              <h3 className="text-sm font-semibold text-slate-800">Xác thực điều kiện</h3>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 ${myAttendance.hasShift ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <MapPinIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Ca làm trong ngày</p>
                    <p className={`text-xs ${myAttendance.hasShift ? 'text-green-600' : 'text-red-500'}`}>
                      {myAttendance.hasShift ? 'Đã có phân ca làm việc' : 'Chưa có ca làm hôm nay'}
                    </p>
                  </div>
                  {myAttendance.hasShift ? <CheckCircle2Icon className="mt-0.5 h-4 w-4 text-green-500" /> : <AlertCircleIcon className="mt-0.5 h-4 w-4 text-red-400" />}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 ${isAlreadyCheckedIn ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                    <WifiIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Trạng thái chấm công</p>
                    <p className={`text-xs ${isAlreadyCheckedIn ? 'text-blue-600' : 'text-amber-600'}`}>
                      {isAlreadyCheckedIn ? 'Đã vào ca, có thể ra ca nếu còn ca mở' : 'Chưa vào ca trong ngày'}
                    </p>
                  </div>
                </div>
              </div>
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

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
      ) : null}

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Chấm công hằng ngày</h2>
            <p className="mt-1 text-sm text-gray-500">
              Ngày chấm công: {attendanceDate ? new Date(attendanceDate).toLocaleDateString('vi-VN') : 'Hôm nay'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            />
            <button
              type="button"
              onClick={handleReloadToday}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCcwIcon className="h-4 w-4" />
              Làm mới
            </button>
            {isStaffMode ? (
              <>
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={saving || loading || !myAttendance.canCheckIn}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? 'Đang xử lý...' : 'Vào ca'}
                </button>
                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={saving || loading || !myAttendance.canCheckOut}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Đang xử lý...' : 'Ra ca'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-600 disabled:opacity-60"
              >
                <SaveIcon className="h-4 w-4" />
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500">Tổng nhân viên</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">{rows.length}</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-xs text-emerald-700">Có mặt</p>
            <p className="mt-1 text-xl font-semibold text-emerald-800">{presentCount}</p>
          </div>
          <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3">
            <p className="text-xs text-rose-700">Vắng</p>
            <p className="mt-1 text-xl font-semibold text-rose-800">{Math.max(0, rows.length - presentCount)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-900">{isStaffMode ? 'Ca làm của tôi' : 'Danh sách nhân viên'}</h3>
          {!isStaffMode ? (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => handleToggleAll(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
              />
              Chọn tất cả có mặt
            </label>
          ) : null}
        </div>

        {loading ? (
          <div className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800">Đang tải dữ liệu nhân viên...</div>
        ) : isStaffMode ? (
          !myAttendance.hasShift ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">Bạn không có ca làm trong ngày này</div>
          ) : (
            <div className="space-y-2">
              {myAttendance.shifts.map((shift) => {
                const hasIn = Boolean(shift.checkIn)
                const hasOut = Boolean(shift.checkOut)
                return (
                  <div key={shift.mpcl} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <p className="text-sm font-semibold text-gray-900">{shift.shiftName || `Ca #${shift.shiftId}`}</p>
                    <p className="text-xs text-gray-500">{shift.startTime || '--:--'} - {shift.endTime || '--:--'}</p>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
                      <p className="text-emerald-700">Vào ca: {hasIn ? new Date(shift.checkIn).toLocaleString('vi-VN') : 'Chưa vào ca'}</p>
                      <p className="text-blue-700">Ra ca: {hasOut ? new Date(shift.checkOut).toLocaleString('vi-VN') : 'Chưa ra ca'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">Không có nhân viên để chấm công</div>
        ) : (
          <div className="space-y-2">
            {rows.map((item) => {
              const checked = Boolean(presentMap[Number(item.mnv)])
              return (
                <label
                  key={Number(item.mnv)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 ${checked ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white'}`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.fullName}</p>
                    <p className="text-xs text-gray-500">NV{String(item.mnv).padStart(3, '0')} • {item.positionName || 'Chưa cập nhật chức vụ'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${checked ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {checked ? 'Có mặt' : 'Vắng'}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setPresentMap((prev) => ({
                          ...prev,
                          [Number(item.mnv)]: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                    />
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
