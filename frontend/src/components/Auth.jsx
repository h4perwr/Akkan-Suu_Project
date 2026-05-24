import { useState } from 'react'
import styles from './Auth.module.css'

export default function Auth({ setToken }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')      
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
<<<<<<<< HEAD:frontend/src/components/Auth.jsx
    
========
>>>>>>>> main:Desktop/akkan-suu/src/components/Auth.jsx
        const formData = new URLSearchParams()
        formData.append('username', email)
        formData.append('password', password)

<<<<<<<< HEAD:frontend/src/components/Auth.jsx
        const response = await fetch(`${API_URL}/api/login`, {
========
        const response = await fetch('http://127.0.0.1:8000/api/login', {
>>>>>>>> main:Desktop/akkan-suu/src/components/Auth.jsx
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        })

        if (!response.ok) {
          const errData = await response.json()
<<<<<<<< HEAD:frontend/src/components/Auth.jsx
          throw new Error(errData.detail || 'Ошибка при входе')
        }

        const data = await response.json()
        localStorage.setItem('token', data.access_token) 
        setToken(data.access_token) 

      } else {
        const response = await fetch(`${API_URL}/api/register`, {
========
          throw new Error(errData.detail || 'Неверный email или пароль')
        }

        const data = await response.json()
        localStorage.setItem('token', data.access_token)
        if (setToken) setToken(data.access_token)

      } else {
        const response = await fetch('http://127.0.0.1:8000/api/register', {
>>>>>>>> main:Desktop/akkan-suu/src/components/Auth.jsx
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })

        if (!response.ok) {
          const errData = await response.json()
<<<<<<<< HEAD:frontend/src/components/Auth.jsx
          throw new Error(errData.detail || 'Ошибка при регистрации')
========
          throw new Error(errData.detail || 'Ошибка регистрации')
>>>>>>>> main:Desktop/akkan-suu/src/components/Auth.jsx
        }

        const data = await response.json()
        localStorage.setItem('token', data.access_token)
<<<<<<<< HEAD:frontend/src/components/Auth.jsx
        setToken(data.access_token)
========
        if (setToken) setToken(data.access_token)
>>>>>>>> main:Desktop/akkan-suu/src/components/Auth.jsx
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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