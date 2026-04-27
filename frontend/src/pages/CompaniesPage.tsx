import { useState, useEffect, FormEvent } from 'react'
import { companiesApi, Company, CompanyPayload } from '../services/api'
import styles from './CompaniesPage.module.css'

const EMPTY_FORM: Partial<CompanyPayload> = {
  name: '', email: '', phone: '', address: '', licenseType: 'trial',
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Company | null>(null)
  const [form, setForm] = useState<Partial<CompanyPayload>>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    companiesApi.list()
      .then(setCompanies)
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (c: Company) => {
    setEditTarget(c)
    setForm({ name: c.name, email: c.email, phone: c.phone, address: c.address, licenseType: c.licenseType as any })
    setShowModal(true)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editTarget) {
        await companiesApi.update(editTarget.id, form)
      } else {
        await companiesApi.create(form)
      }
      setShowModal(false)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await companiesApi.remove(id)
      load()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeleteId(null)
    }
  }

  const field = (key: keyof CompanyPayload) => ({
    value: (form[key] as string) || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  })

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Companies</h1>
          <p className={styles.sub}>Manage ISP tenants and their licenses</p>
        </div>
        <button className={styles.addBtn} onClick={openCreate}>
          + Add Company
        </button>
      </div>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <span>⚠</span> {error}
          <button onClick={() => setError('')} className={styles.dismissBtn}>✕</button>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.loader}>
            <div className={styles.spinner} />
            <span>Loading…</span>
          </div>
        ) : companies.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>⬡</div>
            <p>No companies yet</p>
            <button className={styles.addBtn} onClick={openCreate}>Add your first company</button>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Company</th>
                <th>License Key</th>
                <th>License Type</th>
                <th>Max Customers</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className={styles.companyCell}>
                      <div className={styles.avatar}>{c.name[0].toUpperCase()}</div>
                      <div>
                        <div className={styles.companyName}>{c.name}</div>
                        <div className={styles.companyEmail}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code className={styles.key}>{c.licenseKey}</code>
                  </td>
                  <td>
                    <span className={`${styles.licenseBadge} ${styles[c.licenseType]}`}>
                      {c.licenseType}
                    </span>
                  </td>
                  <td>{c.maxCustomers}</td>
                  <td>
                    <span className={`${styles.status} ${c.isActive ? styles.active : styles.inactive}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.editBtn} onClick={() => openEdit(c)}>Edit</button>
                      {deleteId === c.id ? (
                        <>
                          <button className={styles.confirmDeleteBtn} onClick={() => handleDelete(c.id)}>Confirm</button>
                          <button className={styles.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
                        </>
                      ) : (
                        <button className={styles.deleteBtn} onClick={() => setDeleteId(c.id)}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editTarget ? `Edit ${editTarget.name}` : 'New Company'}
              </h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.formGrid}>
                <label className={styles.label}>
                  Company Name *
                  <input className={styles.input} required {...field('name')} placeholder="Mwananchi Telecom" />
                </label>
                <label className={styles.label}>
                  Email
                  <input className={styles.input} type="email" {...field('email')} placeholder="admin@isp.co.ke" />
                </label>
                <label className={styles.label}>
                  Phone
                  <input className={styles.input} {...field('phone')} placeholder="+254 700 000000" />
                </label>
                <label className={styles.label}>
                  License Type
                  <select className={styles.input} {...field('licenseType')}>
                    <option value="trial">Trial</option>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </label>
                <label className={`${styles.label} ${styles.fullWidth}`}>
                  Address
                  <input className={styles.input} {...field('address')} placeholder="Mombasa, Kenya" />
                </label>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn2} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? <span className={styles.spinnerSm} /> : null}
                  {editTarget ? 'Save Changes' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
