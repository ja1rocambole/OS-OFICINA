import { useEffect, useState } from 'react'

function App() {
  const [customers, setCustomers] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    document: '',
    address: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const loadCustomers = async () => {
    try {
      setCustomers(await window.api.getCustomers())
    } catch (loadError) {
      console.error(loadError)
      setError('Não foi possível carregar os clientes.')
    }
  }

  useEffect(() => {
    let isMounted = true

    window.api
      .getCustomers()
      .then((customerList) => {
        if (isMounted) {
          setCustomers(customerList)
        }
      })
      .catch((loadError) => {
        console.error(loadError)
        if (isMounted) {
          setError('Não foi possível carregar os clientes.')
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleChange = ({ target }) => {
    setFormData((currentData) => ({ ...currentData, [target.name]: target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.name.trim()) {
      setError('Informe o nome do cliente.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await window.api.saveCustomer(formData)
      setFormData({ name: '', phone: '', document: '', address: '' })
      await loadCustomers()
    } catch (saveError) {
      console.error(saveError)
      setError('Não foi possível salvar o cliente.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">OS Oficina</p>
          <h1>Clientes</h1>
          <p className="page-description">Cadastre e consulte os clientes da oficina.</p>
        </div>
        <span className="customer-count">{customers.length} cadastrados</span>
      </header>

      <section className="content-grid">
        <form className="panel customer-form" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Novo registro</p>
              <h2>Cadastrar cliente</h2>
            </div>
          </div>

          <label>
            Nome completo
            <input name="name" value={formData.name} onChange={handleChange} required />
          </label>
          <label>
            Telefone
            <input name="phone" value={formData.phone} onChange={handleChange} />
          </label>
          <label>
            CPF/CNPJ
            <input name="document" value={formData.document} onChange={handleChange} />
          </label>
          <label>
            Endereço
            <input name="address" value={formData.address} onChange={handleChange} />
          </label>

          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar cliente'}
          </button>
        </form>

        <section className="panel customer-list">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Base de clientes</p>
              <h2>Clientes cadastrados</h2>
            </div>
          </div>

          {customers.length === 0 ? (
            <p className="empty-state">Nenhum cliente cadastrado ainda.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>Documento</th>
                    <th>Endereço</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.name}</td>
                      <td>{customer.phone || '-'}</td>
                      <td>{customer.document || '-'}</td>
                      <td>{customer.address || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
