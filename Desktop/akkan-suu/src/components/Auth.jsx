import { useState } from 'react'
import { supabase } from '../supabase'
import styles from './Auth.module.css'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    let result
    if (isLogin) {
      result = await supabase.auth.signInWithPassword({ email, password })
    } else {
      result = await supabase.auth.signUp({ email, password })
    }
    if (result.error) setError(result.error.message)
    setLoading(false)
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.logo}>💧</div>
        <h1 className={styles.title}>Akkan-Suu</h1>
        <p className={styles.subtitle}>Умный полив для вашего поля</p>

        <input
          className={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className={styles.input}
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>

        <p className={styles.toggle} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </p>
      </div>
    </div>
  )
}