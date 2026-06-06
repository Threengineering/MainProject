import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useProfile(session) {
  const [widgetData, setWidgetData] = useState({});
  const [activeWidgets, setActiveWidgets] = useState([]);
  const [newsLimit, setNewsLimit] = useState(5);

  useEffect(() => {
    if (!session) return;
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles').select('interests').eq('id', session.user.id);
      if (error || !data?.[0]?.interests) return;

      const interests = data[0].interests;
      if (interests.NewsLimit) setNewsLimit(interests.NewsLimit);
      if (interests.Todo) {
        interests.Todo = interests.Todo.map((item, i) =>
          typeof item === 'string' ? { id: `legacy_${i}`, text: item, done: false } : item
        );
      }
      setWidgetData(interests);
      if (Array.isArray(interests.ActiveWidgets)) {
        setActiveWidgets(interests.ActiveWidgets);
      } else {
        const activeKeys = Object.keys(interests).filter(key =>
          Array.isArray(interests[key]) && interests[key].length > 0 && key !== 'ActiveWidgets'
        );
        setActiveWidgets(activeKeys);
      }
    };
    fetchProfile();
  }, [session]);

  const persistInterests = async (updatedInterests) => {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: session.user.id, interests: updatedInterests });
    return !error;
  };

  return { widgetData, setWidgetData, activeWidgets, setActiveWidgets, newsLimit, setNewsLimit, persistInterests };
}
