import { useState } from 'react'
import styles from './Dashboard.module.css'

const REGIONS = [
  'Чуйский район', 'Ошская область', 'Иссык-Кульская область',
  'Нарынская область', 'Джалал-Абадская область', 'Таласская область', 'Баткенская область'
]


export default function Dashboard({ token, onLogout }) {
  const [region, setRegion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)


  const getUserEmail = () => {
    try {
      const payload = token.split('.')[1]
      return JSON.parse(atob(payload)).sub
    } catch {
      return 'Фермер'
    }
  }

  const getRecommendation = async () => {
    if (!region) return alert('Выберите район!')
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ region })
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          alert('Время сессии истекло. Пожалуйста, войдите заново.')
          onLogout()
          return
        }
        throw new Error('Ошибка сервера')
      }
      
      const data = await response.json()
      setResult(data) 
    } catch (err) {
      alert('Не удалось подключиться к серверу. Проверьте, запущен ли бэкенд!')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerLogo}>💧</span>
          <span className={styles.headerTitle}>Akkan-Suu</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.email}>{getUserEmail()}</span>
          <button className={styles.logoutBtn} onClick={onLogout}>Выйти</button>
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
            {loading ? <span className={styles.spinner}>⏳ Анализирую с ИИ...</span> : '🤖 Получить совет'}
          </button>
        </div>

        {result && result.ai_analysis && (
          <div className={styles.resultWrapper}>
            <div className={styles.weatherCard}>
              <h3>🌤 Погода (Open-Meteo)</h3>
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
                  <span className={styles.weatherVal}>{result.weather.rain_mm} мм</span>
                  <span className={styles.weatherLbl}>Осадки</span>
                </div>
              </div>
            </div>

            <div className={`${styles.recCard} ${result.ai_analysis.recommendation !== 'SKIP' ? styles.water : styles.noWater}`}>
              <div className={styles.recIcon}>
                {result.ai_analysis.recommendation !== 'SKIP' ? '💧' : '✅'}
              </div>
              <div>
                <h3 className={styles.recTitle}>
                  {result.ai_analysis.recommendation === 'SKIP' ? 'Полив можно пропустить' : 
                   result.ai_analysis.recommendation === 'REDUCE' ? 'Сокращенный полив' : 
                   result.ai_analysis.recommendation === 'INCREASE' ? 'Усиленный полив' : 'Плановый полив'} 
                  {result.ai_analysis.recommendation !== 'SKIP' && ` (${result.ai_analysis.water_amount_liters_per_m2} л/м²)`}
                </h3>
                <p className={styles.recReason}><strong>Анализ ИИ:</strong> {result.ai_analysis.reason}</p>
                
                {result.ai_analysis.tips && result.ai_analysis.tips.length > 0 && (
                  <ul style={{ marginTop: '10px', paddingLeft: '20px', fontSize: '0.9rem', color: '#555' }}>
                    {result.ai_analysis.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}