import { useEffect, useState } from 'react';
import { api, loadSession, clearSession } from './api';
import LoginScreen from './components/LoginScreen';
import BookingScreen from './components/BookingScreen';
import ScheduleScreen from './components/ScheduleScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState('booking'); // 'booking' | 'schedule'
  const [rooms, setRooms] = useState([]);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const session = loadSession();
    if (session) setCurrentUser(session.user);
    setCheckingSession(false);
  }, []);

  useEffect(() => {
    if (currentUser) {
      api.getRooms().then(setRooms).catch(() => {});
    }
  }, [currentUser]);

  function handleLogout() {
    clearSession();
    setCurrentUser(null);
    setEditingMeeting(null);
    setActiveTab('booking');
  }

  function handleSaved() {
    setEditingMeeting(null);
    setActiveTab('schedule');
    setRefreshKey((k) => k + 1);
  }

  function handleRequestEdit(meeting) {
    setEditingMeeting(meeting);
    setActiveTab('booking');
  }

  if (checkingSession) return null;

  if (!currentUser) {
    return <LoginScreen onLoggedIn={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm">
              R
            </div>
            <span className="font-semibold text-gray-900">RoomFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:inline">
              Xin chào, <span className="font-medium text-gray-800">{currentUser.name}</span>
            </span>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600">
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <nav className="max-w-5xl mx-auto px-4 pt-4">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => {
              setActiveTab('booking');
              setEditingMeeting(null);
            }}
            className={`px-4 py-1.5 text-sm rounded-md font-medium transition ${
              activeTab === 'booking' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Tạo lịch họp mới
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-1.5 text-sm rounded-md font-medium transition ${
              activeTab === 'schedule' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Quản lý cuộc họp
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'booking' && (
          <BookingScreen
            rooms={rooms}
            editingMeeting={editingMeeting}
            currentUser={currentUser}
            onSaved={handleSaved}
            onCancelEdit={() => {
              setEditingMeeting(null);
              setActiveTab('schedule');
            }}
          />
        )}
        {activeTab === 'schedule' && (
          <ScheduleScreen currentUser={currentUser} refreshKey={refreshKey} onRequestEdit={handleRequestEdit} />
        )}
      </main>
    </div>
  );
}
