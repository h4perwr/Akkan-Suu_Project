import { useState, useEffect } from 'react'
import styles from './Dashboard.module.css'

const REGIONS = [
  { id: 1, name: 'Чуйская область', x: '42%', y: '22%' },
  { id: 2, name: 'Иссык-Кульская', x: '68%', y: '30%' },
  { id: 3, name: 'Нарынская', x: '58%', y: '48%' },
  { id: 4, name: 'Ошская область', x: '38%', y: '72%' },
  { id: 5, name: 'Джалал-Абадская', x: '22%', y: '62%' },
  { id: 6, name: 'Таласская', x: '20%', y: '28%' },
  { id: 7, name: 'Баткенская', x: '18%', y: '78%' },
]

const CROPS = ['Пшеница', 'Картофель', 'Сахарная свёкла', 'Томат', 'Кукуруза', 'Люцерна']
const SOILS = ['Суглинок', 'Песчаная', 'Глинистая', 'Чернозём']
const IRRIGATIONS = ['Капельный', 'Дождевальный', 'Поверхностный']

const MOCK = {
  weather: { temperature: 24, condition: 'Пасмурно, возможен дождь', humidity: 75 },
  recommendation: {
    should_water: false,
    reason: 'Завтра ожидаются осадки до 5 мм, влажность почвы высокая. Поливать урожай в ближайшие 24 часа не рекомендуется, чтобы избежать загнивания корней.'
  }
}

export default function Dashboard({ token }) {
  const [theme, setTheme] = useState('light')
  const [activeRegion, setActiveRegion] = useState(null)
  const [crop, setCrop] = useState('Пшеница')
  const [soil, setSoil] = useState('Суглинок')
  const [area, setArea] = useState('10')
  const [irrigation, setIrrigation] = useState('Капельный')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Здравствуйте! Я ИИ-агроном. Задайте вопрос о поливе или урожае.' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const currentToken = token || localStorage.getItem('token')
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const handleLogout = () => {

    localStorage.removeItem('token')
    window.location.reload()
  }

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  const getRecommendation = async () => {
    if (!activeRegion) return alert('Выберите регион на карте!')
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`${BACKEND_URL}/api/recommendation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },

        body: JSON.stringify({ region: activeRegion.name, crop, soil, area, irrigation })
      })
      if (!res.ok) {
          const errData = await res.json()
          console.error("Ошибка от бэкенда:", errData)
          throw new Error()
      }
      setResult(await res.json())
    } catch (err) {
      console.error(err)
      await new Promise(r => setTimeout(r, 2000))
      setResult(MOCK)
    }
    setLoading(false)
  }

  const sendChat = async () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput
    setChatMessages(m => [...m, { role: 'user', text: userMsg }])
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({ message: userMsg })
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setChatMessages(m => [...m, { role: 'assistant', text: data.reply }])
    } catch {
      await new Promise(r => setTimeout(r, 1500))
      setChatMessages(m => [...m, { role: 'assistant', text: 'Для данного региона рекомендую полив ранним утром (5-7 часов). Норма полива для ' + (crop || 'пшеницы') + ' составляет около 30-40 л/сотку при текущих погодных условиях.' }])
    }
    setChatLoading(false)
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
<div style={{width:40, height:40, borderRadius:'50%', background:'#2ecc71', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22}}>💧</div>          <div>
            <div className={styles.logoTitle}>Akkan-Suu</div>
            <div className={styles.logoSub}>Аккан-Суу — Умный полив</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.themeBtn} onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>Выйти</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.grid}>

          <div className={styles.mapSection}>
            <div className={styles.cardHeader}>Выберите регион</div>
            <div className={styles.mapWrapper}>
              {REGIONS.map(r => (
                <button
                  key={r.id}
                  className={`${styles.pin} ${activeRegion?.id === r.id ? styles.pinActive : ''}`}
                  style={{ left: r.x, top: r.y }}
                  onClick={() => setActiveRegion(r)}
                >
                  📍
                  <span className={styles.pinLabel}>{r.name}</span>
                </button>
              ))}
            </div> 

            <div className={styles.fieldsCard}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Культура</label>
                  <select value={crop} onChange={e => setCrop(e.target.value)}>
                    {CROPS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Почва</label>
                  <select value={soil} onChange={e => setSoil(e.target.value)}>
                    {SOILS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Площадь (га)</label>
                  <input type="number" value={area} onChange={e => setArea(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Полив</label>
                  <select value={irrigation} onChange={e => setIrrigation(e.target.value)}>
                    {IRRIGATIONS.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <button className={styles.btnPrimary} onClick={getRecommendation}>
                ✨ Получить рекомендации
              </button>
            </div>
          </div>

          <div className={styles.resultSection}>
            {!loading && !result && (
              <div className={styles.emptyCard}>
                <div style={{fontSize: 52}}>🌱</div>
                <p>Выберите регион на карте и нажмите «Получить рекомендации»</p>
              </div>
            )}

            {loading && (
              <div className={styles.skeletonWrapper}>
                <div className={styles.skeletonHeader}></div>
                <div className={styles.skeletonGrid}>
                  <div className={styles.skeletonCard}></div>
                  <div className={styles.skeletonCard}></div>
                  <div className={styles.skeletonCard}></div>
                </div>
                <div className={styles.skeletonText}></div>
                <div className={styles.skeletonText} style={{width:'75%'}}></div>
                <div className={styles.skeletonText} style={{width:'60%'}}></div>
              </div>
            )}

            {result && (
              <div>
                <div className={styles.card} style={{marginBottom: 14}}>
                  <div className={styles.cardHeader}>🌤 Погода — {activeRegion?.name}</div>
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <span className={styles.statIcon}>🌡️</span>
                      <span className={styles.statVal}>{result.weather.temperature}°C</span>
                      <span className={styles.statLbl}>Температура</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statIcon}>💧</span>
                      <span className={styles.statVal}>{result.weather.humidity}%</span>
                      <span className={styles.statLbl}>Влажность</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statIcon}>⛅</span>
                      <span className={styles.statVal} style={{fontSize:12}}>{result.weather.condition || "Данные с Open-Meteo"}</span>
                      <span className={styles.statLbl}>Условия</span>
                    </div>
                  </div>
                </div>

                <div className={`${styles.recCard} ${result.ai_analysis?.recommendation === "SKIP" ? styles.noWater : styles.water}`}>
                  <div className={styles.recIcon}>
                    {result.ai_analysis?.recommendation === "SKIP" ? '✅' : '💧'}
                  </div>
                  <div>
                    <div className={styles.recTitle}>
                      {result.ai_analysis?.recommendation === "SKIP" ? 'Полив не нужен' : 'Полив нужен!'}
                    </div>
                    <div className={styles.recReason}>
                      {result.ai_analysis?.reason || result.recommendation?.reason}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className={styles.chatWidget}>
        {chatOpen && (
          <div className={styles.chatBox}>
            <div className={styles.chatHeader}>
              <span>🤖 ИИ-Агроном</span>
              <button onClick={() => setChatOpen(false)}>✕</button>
            </div>
            <div className={styles.chatMessages}>
              {chatMessages.map((m, i) => (
                <div key={i} className={`${styles.chatMsg} ${m.role === 'user' ? styles.chatUser : styles.chatBot}`}>
                  {m.text}
                </div>
              ))}
              {chatLoading && (
                <div className={styles.chatMsg}>
                  <span className={styles.typing}>●●●</span>
                </div>
              )}
            </div>
            <div className={styles.chatInputRow}>
              <input
                className={styles.chatInput}
                placeholder="Задайте вопрос агроному..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
              />
              <button className={styles.chatSend} onClick={sendChat}>➤</button>
            </div>
          </div>
        )}
        <button className={styles.chatToggle} onClick={() => setChatOpen(!chatOpen)}>
          {chatOpen ? '✕' : '🤖'}
        </button>
      </div>
    </div>
  )
}