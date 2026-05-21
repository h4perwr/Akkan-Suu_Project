import { useState } from 'react'
import { supabase } from '../supabase'
import styles from './Dashboard.module.css'

const REGIONS = [
  'Чуйский район', 'Ошская область', 'Иссык-Кульская область',
  'Нарынская область', 'Джалал-Абадская область', 'Таласская область', 'Баткенская область'
]

const MOCK_RESPONSE = {
  weather: { temperature: 24, condition: 'Пасмурно, возможен дождь', humidity: 75 },
  recommendation: {
    should_water: false,
    reason: 'Завтра ожидаются осадки до 5 мм, влажность почвы высокая. Поливать урожай в ближайшие 24 часа не рекомендуется, чтобы избежать загнивания корней.'
  }
}

export default function Dashboard({ session }) {
  const [region, setRegion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleLogout = () => supabase.auth.signOut()

  const getRecommendation = async () => {
    if (!region) return alert('Выберите район!')
    setLoading(true)
    setResult(null)

    try {
      const token = session.access_token
      const response = await fetch('http://localhost:8000/api/recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ region })
      })
      if (!response.ok) throw new Error('Backend not ready')
      const data = await response.json()
      setResult(data)
    } catch {
      await new Promise(r => setTimeout(r, 2000))
      setResult(MOCK_RESPONSE)
    }

    setLoading(false)
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerLogo}>💧</span>
          <span className={styles.headerTitle}>Akkan-Suu</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.email}>{session.user.email}</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>Выйти</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h2 className={styles.heroTitle}>🌱 Умный полив</h2>
          <p className={styles.heroSub}>Выберите ваш район и получите рекомендацию от ИИ-агронома</p>
        </div>

        <div className={styles.card}>
          <label className={styles.label}>Ваш район</label>
          <select className={styles.select} value={region} onChange={e => setRegion(e.target.value)}>
            <option value="">— Выберите район —</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <button className={styles.btn} onClick={getRecommendation} disabled={loading}>
            {loading ? <span className={styles.spinner}>⏳ Анализирую...</span> : '🤖 Получить совет'}
          </button>
        </div>

        {result && (
          <div className={styles.resultWrapper}>
            <div className={styles.weatherCard}>
              <h3>🌤 Погода</h3>
              <div className={styles.weatherGrid}>
                <div className={styles.weatherItem}>
                  <span className={styles.weatherVal}>{result.weather.temperature}°C</span>
                  <span className={styles.weatherLbl}>Температура</span>
                </div>
                <div className={styles.weatherItem}>
                  <span className={styles.weatherVal}>{result.weather.humidity}%</span>
                  <span className={styles.weatherLbl}>Влажность</span>
                </div>
                <div className={styles.weatherItem}>
                  <span className={styles.weatherVal}>{result.weather.condition}</span>
                  <span className={styles.weatherLbl}>Условия</span>
                </div>
              </div>
            </div>

            <div className={`${styles.recCard} ${result.recommendation.should_water ? styles.water : styles.noWater}`}>
              <div className={styles.recIcon}>
                {result.recommendation.should_water ? '💧' : '✅'}
              </div>
              <div>
                <h3 className={styles.recTitle}>
                  {result.recommendation.should_water ? 'Полив нужен!' : 'Полив не нужен'}
                </h3>
                <p className={styles.recReason}>{result.recommendation.reason}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}