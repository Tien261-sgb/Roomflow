import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import MeetingModal from './MeetingModal';

const DAY_NAMES = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // tuần bắt đầu từ Thứ 2
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDayHeader(d) {
  return `${DAY_NAMES[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatTimeRange(startIso, endIso) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(s.getHours())}:${pad(s.getMinutes())} - ${pad(e.getHours())}:${pad(e.getMinutes())}`;
}

export default function ScheduleScreen({ currentUser, refreshKey, onRequestEdit }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  async function loadMeetings() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getMeetings(weekStart.toISOString(), weekEnd.toISOString());
      setMeetings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, refreshKey]);

  function meetingsForDay(day) {
    return meetings
      .filter((m) => isSameDay(new Date(m.start_time), day))
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }

  function handleEdit(meeting) {
    setSelectedMeeting(null);
    onRequestEdit(meeting);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Quản lý cuộc họp</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            ← Tuần trước
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Hôm nay
          </button>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Tuần sau →
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {formatDayHeader(weekStart)} — {formatDayHeader(addDays(weekStart, 6))}
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Đang tải lịch họp...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {days.map((day) => {
            const dayMeetings = meetingsForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={`rounded-xl border p-3 min-h-[140px] ${
                  isToday ? 'border-primary bg-primary-light/40' : 'border-gray-200 bg-white'
                }`}
              >
                <p className={`text-xs font-semibold mb-2 ${isToday ? 'text-primary' : 'text-gray-500'}`}>
                  {formatDayHeader(day)}
                </p>
                <div className="space-y-1.5">
                  {dayMeetings.length === 0 && <p className="text-xs text-gray-300">Không có lịch</p>}
                  {dayMeetings.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMeeting(m)}
                      className={`w-full text-left text-xs rounded-lg px-2 py-1.5 transition ${
                        m.organizer_id === currentUser.id
                          ? 'bg-primary text-white hover:bg-primary-dark'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="font-medium truncate">{m.title}</div>
                      <div className="opacity-80">{formatTimeRange(m.start_time, m.end_time)}</div>
                      <div className="opacity-80 truncate">{m.room_name}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedMeeting && (
        <MeetingModal
          meeting={selectedMeeting}
          currentUser={currentUser}
          onClose={() => setSelectedMeeting(null)}
          onDeleted={() => {
            setSelectedMeeting(null);
            loadMeetings();
          }}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}
