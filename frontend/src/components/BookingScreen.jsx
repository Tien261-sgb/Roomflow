import { useEffect, useState } from 'react';
import { api } from '../api';

const EQUIPMENT_OPTIONS = ['Máy chiếu', 'TV màn hình', 'Micro', 'Bảng trắng', 'Hệ thống âm thanh'];

function toLocalDateValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toLocalTimeValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BookingScreen({ rooms, editingMeeting, onSaved, onCancelEdit, currentUser }) {
  const [title, setTitle] = useState('');
  const [roomId, setRoomId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTimeOnly, setStartTimeOnly] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTimeOnly, setEndTimeOnly] = useState('');
  const [attendeeInput, setAttendeeInput] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [description, setDescription] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(editingMeeting);

  useEffect(() => {
    if (editingMeeting) {
      setTitle(editingMeeting.title);
      setRoomId(String(editingMeeting.room_id));
      setStartDate(toLocalDateValue(editingMeeting.start_time));
      setStartTimeOnly(toLocalTimeValue(editingMeeting.start_time));
      setEndDate(toLocalDateValue(editingMeeting.end_time));
      setEndTimeOnly(toLocalTimeValue(editingMeeting.end_time));
      setAttendees(editingMeeting.attendees || []);
      setEquipment(editingMeeting.equipment || []);
      setDescription(editingMeeting.description || '');
      setError('');
      setSuccess('');
    }
  }, [editingMeeting]);

  function resetForm() {
    setTitle('');
    setRoomId('');
    setStartDate('');
    setStartTimeOnly('');
    setEndDate('');
    setEndTimeOnly('');
    setAttendees([]);
    setAttendeeInput('');
    setEquipment([]);
    setDescription('');
  }

  function addAttendee() {
    const value = attendeeInput.trim();
    if (value && !attendees.includes(value)) {
      setAttendees([...attendees, value]);
    }
    setAttendeeInput('');
  }

  function handleAttendeeKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addAttendee();
    }
  }

  function removeAttendee(name) {
    setAttendees(attendees.filter((a) => a !== name));
  }

  function toggleEquipment(item) {
    setEquipment((prev) => (prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim() || !roomId || !startDate || !startTimeOnly || !endDate || !endTimeOnly) {
      setError('Vui lòng điền đầy đủ tên cuộc họp, phòng, ngày/giờ bắt đầu và kết thúc.');
      return;
    }

    const startTime = `${startDate}T${startTimeOnly}`;
    const endTime = `${endDate}T${endTimeOnly}`;

    const payload = {
      title: title.trim(),
      roomId: Number(roomId),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      attendees,
      equipment,
      description,
    };

    setSaving(true);
    try {
      if (isEditing) {
        await api.updateMeeting(editingMeeting.id, payload);
        setSuccess('Cập nhật cuộc họp thành công!');
      } else {
        await api.createMeeting(payload);
        setSuccess('Tạo lịch họp thành công!');
        resetForm();
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Chỉnh sửa cuộc họp' : 'Tạo lịch họp mới'}
        </h2>
        {isEditing && (
          <button
            onClick={onCancelEdit}
            type="button"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Hủy chỉnh sửa
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên cuộc họp *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Họp kế hoạch quý 3"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phòng họp *</label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">-- Chọn phòng --</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} (sức chứa {r.capacity}, {r.location})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu *</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-gray-400 mt-0.5">Ngày / Tháng / Năm</p>
              </div>
              <div>
                <input
                  type="time"
                  value={startTimeOnly}
                  onChange={(e) => setStartTimeOnly(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-gray-400 mt-0.5">Giờ : Phút</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc *</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-gray-400 mt-0.5">Ngày / Tháng / Năm</p>
              </div>
              <div>
                <input
                  type="time"
                  value={endTimeOnly}
                  onChange={(e) => setEndTimeOnly(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-gray-400 mt-0.5">Giờ : Phút</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Người tham dự</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {attendees.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1 bg-primary-light text-primary text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {a}
                <button type="button" onClick={() => removeAttendee(a)} className="hover:text-primary-dark">
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            value={attendeeInput}
            onChange={(e) => setAttendeeInput(e.target.value)}
            onKeyDown={handleAttendeeKeyDown}
            onBlur={addAttendee}
            placeholder="Gõ tên rồi nhấn Enter hoặc dấu phẩy"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Thiết bị cần dùng</label>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => toggleEquipment(item)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  equipment.includes(item)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Nội dung, mục tiêu cuộc họp..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-medium rounded-lg py-2.5 text-sm transition"
        >
          {saving ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo lịch họp'}
        </button>
      </form>
    </div>
  );
}