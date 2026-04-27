import { useState, useEffect } from 'react'
import { companiesApi, Company } from '../services/api'
import { useAuth } from '../context/AuthContext'
import styles from './DashboardPage.module.css'

interface Stat {
  label: string
  value: string | number
  sub?: string
  color?: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    companiesApi.list()
      .then(setCompanies)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const stats: Stat[] = [
    {
      label: 'Total Companies',
      value: loading ? '—' : companies.length,
      sub: 'registered ISPs',
      color: 'var(--accent)',
    },
    {
      label: 'Active Companies',
      value: loading ? '—' : companies.filter((c) => c.isActive).length,
      sub: 'currently active',
      color: 'var(--info)',
    },
    {
      label: 'Total Users',
      value: loading ? '—' : companies.reduce((acc, c) => acc + (c.users?.length ?? 0), 0),
      sub: 'across all companies',
      color: 'var(--warning)',
    },
    {
      label: 'Trial Companies',
      value: loading ? '—' : companies.filter((c) => c.licenseType === 'trial').length,
      sub: 'on trial license',
      color: 'var(--danger)',
    },
  ]

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.sub}>
            Good to see you, <strong>{user?.firstName}</strong>. Here's your system overview.
          </p>
        </div>
        <div className={styles.badge}>
          <span className={styles.dot} />
          System Online
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <span>⚠</span> {error} — check that the backend is running on port 3000.
        </div>
      )}

      {/* Stats */}
      <div className={styles.statsGrid}>
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`${styles.statCard} fade-up fade-up-${i + 1}`}
            style={{ '--accent-color': s.color } as React.CSSProperties}
          >
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statSub}>{s.sub}</span>
            <div className={styles.statBar} />
          </div>
        ))}
      </div>

      {/* Recent companies table */}
      <div className={`${styles.section} fade-up fade-up-4`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Companies</h2>
          <a href="/companies" className={styles.seeAll}>View all →</a>
        </div>

        {loading ? (
          <div className={styles.loader}>
            <div className={styles.spinner} />
            <span>Loading companies…</span>
          </div>
        ) : companies.length === 0 ? (
          <div className={styles.empty}>
            <p>No companies registered yet.</p>
            <p>Head to <a href="/companies">Companies</a> to add your first ISP.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Company</th>
                <th>License</th>
                <th>Users</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {companies.slice(0, 8).map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className={styles.companyCell}>
                      <div className={styles.companyAvatar}>
                        {c.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.companyName}>{c.name}</div>
                        <div className={styles.companyEmail}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge2} ${styles[c.licenseType] || ''}`}>
                      {c.licenseType}
                    </span>
                  </td>
                  <td>{c.users?.length ?? 0}</td>
                  <td>
                    <span className={`${styles.statusDot} ${c.isActive ? styles.active : styles.inactive}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
