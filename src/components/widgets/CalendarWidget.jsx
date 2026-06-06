import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarWidget({ providerToken }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState({});
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Fetch holidays from backend
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const res = await fetch(`${API_BASE}/api/holidays?year=${year}&month=${month}`);
        const data = await res.json();
        if (data.holidays) {
          const holidayMap = {};
          data.holidays.forEach(h => {
            holidayMap[h.date] = h.name;
          });
          setHolidays(holidayMap);
        }
      } catch (err) {
        console.error('Failed to fetch holidays', err);
      }
    };
    fetchHolidays();
  }, [currentDate]);

  // Fetch Google Calendar Events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!providerToken) return;
      setLoadingEvents(true);
      try {
        const timeMin = startOfMonth(currentDate).toISOString();
        const timeMax = endOfMonth(currentDate).toISOString();
        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
        
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${providerToken}`
          }
        });
        const data = await res.json();
        if (data.items) {
          setEvents(data.items);
        }
      } catch (err) {
        console.error('Failed to fetch calendar events', err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [currentDate, providerToken]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Calendar Grid Generation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      const dateString = format(day, "yyyy-MM-dd");
      const isHoliday = holidays[dateString];
      const isSunday = day.getDay() === 0;
      
      const dayEvents = events.filter(e => {
        if (e.start.date) {
          return e.start.date === dateString;
        }
        if (e.start.dateTime) {
          return e.start.dateTime.startsWith(dateString);
        }
        return false;
      });

      const isCurrentMonth = isSameMonth(day, monthStart);
      const isToday = isSameDay(day, new Date());

      days.push(
        <div
          key={day}
          className={`flex flex-col p-1 border border-slate-100 min-h-[60px] 
            ${!isCurrentMonth ? "text-slate-300 bg-slate-50/50" : ""}
            ${isToday ? "bg-indigo-50" : "bg-white"}
          `}
        >
          <div className="flex justify-between items-start">
            <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
              ${isToday ? "bg-indigo-600 text-white" : ""}
              ${!isToday && (isHoliday || isSunday) && isCurrentMonth ? "text-rose-400 bg-rose-50" : ""}
              ${!isToday && !isHoliday && !isSunday && isCurrentMonth ? "text-slate-700" : ""}
            `}>
              {formattedDate}
            </span>
          </div>
          
          <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-y-auto">
            {isHoliday && isCurrentMonth && (
              <div className="text-[9px] font-bold text-rose-500 truncate px-1 rounded bg-rose-50">
                {holidays[dateString]}
              </div>
            )}
            {dayEvents.slice(0, 2).map((event, idx) => (
              <div key={idx} className="text-[9px] font-medium text-slate-600 truncate px-1 rounded bg-slate-100 border-l-2 border-indigo-400">
                {event.summary}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-[9px] text-slate-400 font-bold px-1">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7 w-full" key={day}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex flex-col">
          <span className="text-xl font-black text-slate-800 tracking-tight">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Calendar {loadingEvents && "(Syncing...)"}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 w-full mb-2 shrink-0">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
          <div key={day} className={`text-center text-[10px] font-black uppercase tracking-wider ${i === 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 flex flex-col w-full min-h-0 border-t border-l border-slate-100 rounded-xl overflow-hidden shadow-sm">
        {rows}
      </div>
      
      {!providerToken && (
        <div className="mt-2 text-center text-xs text-slate-400">
          Google Calendar 연결을 위해 다시 로그인해주세요.
        </div>
      )}
    </div>
  );
}
