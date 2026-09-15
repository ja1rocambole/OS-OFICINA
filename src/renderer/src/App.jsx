import { useEffect, useState } from 'react'

function App() {
  const [activeModule, setActiveModule] = useState('customers')
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    document: '',
    address: ''
  })
  const [employeeForm, setEmployeeForm] = useState({
    id: null,
    name: '',
    phone: '',
    document: '',
    role: ''
  })
  const [vehicleForm, setVehicleForm] = useState({
    customerId: '',
    licensePlate: '',
    brand: '',
    model: '',
    year: '',
    color: ''
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

  const loadEmployees = async () => {
    try {
      setEmployees(await window.api.getEmployees())
    } catch (loadError) {
      console.error(loadError)
      setError('Não foi possível carregar os funcionários.')
    }
  }

  const loadVehicles = async (customerId) => {
    try {
      setVehicles(await window.api.getVehiclesByCustomer(customerId))
    } catch (loadError) {
      console.error(loadError)
      setError('Não foi possível carregar os veículos.')
    }
  }

  useEffect(() => {
    let isMounted = true

    Promise.all([window.api.getCustomers(), window.api.getEmployees()])
      .then(([customerList, employeeList]) => {
        if (isMounted) {
          setCustomers(customerList)
          setEmployees(employeeList)
        }
      })
      .catch((loadError) => {
        console.error(loadError)
        if (isMounted) {
          setError('Não foi possível carregar os dados.')
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleChange = ({ target }) => {
    const updateForm =
      activeModule === 'customers'
        ? setCustomerForm
        : activeModule === 'employees'
          ? setEmployeeForm
          : setVehicleForm
    updateForm((currentData) => ({ ...currentData, [target.name]: target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const formData =
      activeModule === 'customers'
        ? customerForm
        : activeModule === 'employees'
          ? employeeForm
          : vehicleForm

    if (activeModule === 'vehicles' && !formData.customerId) {
      setError('Selecione um cliente para o veículo.')
      return
    }

    if (activeModule === 'vehicles' && (!formData.licensePlate || !formData.licensePlate.trim())) {
      setError('Informe a placa do veículo.')
      return
    }

    if (activeModule !== 'vehicles' && !formData.name.trim()) {
      setError(`Informe o nome do ${activeModule === 'customers' ? 'cliente' : 'funcionário'}.`)
      return
    }

    setIsSaving(true)
    setError('')

    try {
      if (activeModule === 'customers') {
        await window.api.saveCustomer(formData)
        setCustomerForm({ name: '', phone: '', document: '', address: '' })
        await loadCustomers()
      } else if (activeModule === 'employees' && employeeForm.id) {
        await window.api.updateEmployee(formData)
        setEmployeeForm({ id: null, name: '', phone: '', document: '', role: '' })
        await loadEmployees()
      } else if (activeModule === 'employees') {
        await window.api.saveEmployee(formData)
        setEmployeeForm({ id: null, name: '', phone: '', document: '', role: '' })
        await loadEmployees()
      } else {
        await window.api.saveVehicle(formData)
        setVehicleForm({
          customerId: selectedCustomerId,
          licensePlate: '',
          brand: '',
          model: '',
          year: '',
          color: ''
        })
        await loadVehicles(selectedCustomerId)
      }
    } catch (saveError) {
      console.error(saveError)
      setError(
        `Não foi possível salvar o ${
          activeModule === 'customers'
            ? 'cliente'
            : activeModule === 'employees'
              ? 'funcionário'
              : 'veículo'
        }.`
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleCustomerSelection = async ({ target }) => {
    setSelectedCustomerId(target.value)
    setVehicleForm((currentData) => ({ ...currentData, customerId: target.value }))
    setError('')
    await loadVehicles(target.value)
  }

  const handleEditEmployee = (employee) => {
    setActiveModule('employees')
    setError('')
    setEmployeeForm({
      id: employee.id,
      name: employee.name,
      phone: employee.phone || '',
      document: employee.document || '',
      role: employee.role || ''
    })
  }

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Deseja desativar este funcionário?')) {
      return
    }

    try {
      setError('')
      await window.api.deleteEmployee(employeeId)
      await loadEmployees()
    } catch (deleteError) {
      console.error(deleteError)
      setError('Não foi possível desativar o funcionário.')
    }
  }

  const isCustomerModule = activeModule === 'customers'
  const isEmployeeModule = activeModule === 'employees'
  const formData = isCustomerModule ? customerForm : isEmployeeModule ? employeeForm : vehicleForm
  const moduleLabel = isCustomerModule ? 'Clientes' : isEmployeeModule ? 'Funcionários' : 'Veículos'

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">OS Oficina</p>
          <h1>{moduleLabel}</h1>
          <p className="page-description">
            {isCustomerModule
              ? 'Cadastre e consulte os clientes da oficina.'
              : isEmployeeModule
                ? 'Gerencie os funcionários da oficina.'
                : 'Cadastre veículos vinculados aos clientes.'}
          </p>
        </div>
        <span className="customer-count">
          {isCustomerModule
            ? customers.length
            : isEmployeeModule
              ? employees.length
              : vehicles.length}{' '}
          cadastrados
        </span>
      </header>

      <nav className="module-tabs" aria-label="Módulos">
        <button
          type="button"
          className={isCustomerModule ? 'active' : ''}
          onClick={() => {
            setActiveModule('customers')
            setError('')
          }}
        >
          Clientes
        </button>
        <button
          type="button"
          className={!isCustomerModule ? 'active' : ''}
          onClick={() => {
            setActiveModule('employees')
            setError('')
          }}
        >
          Funcionários
        </button>
        <button
          type="button"
          className={activeModule === 'vehicles' ? 'active' : ''}
          onClick={() => {
            setActiveModule('vehicles')
            setError('')
          }}
        >
          Veículos
        </button>
      </nav>

      <section className="content-grid">
        <form className="panel customer-form" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Novo registro</p>
              <h2>
                {formData.id
                  ? 'Editar funcionário'
                  : `Cadastrar ${isCustomerModule ? 'cliente' : isEmployeeModule ? 'funcionário' : 'veículo'}`}
              </h2>
            </div>
          </div>

          {isCustomerModule || isEmployeeModule ? (
            <>
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
            </>
          ) : (
            <>
              <label>
                Cliente
                <select value={selectedCustomerId} onChange={handleCustomerSelection} required>
                  <option value="">Selecione um cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Placa
                <input
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  maxLength="8"
                  required
                />
              </label>
              <label>
                Marca
                <input name="brand" value={formData.brand} onChange={handleChange} />
              </label>
              <label>
                Modelo
                <input name="model" value={formData.model} onChange={handleChange} />
              </label>
              <label>
                Ano
                <input
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  inputMode="numeric"
                />
              </label>
            </>
          )}
          {isCustomerModule ? (
            <label>
              Endereço
              <input name="address" value={formData.address} onChange={handleChange} />
            </label>
          ) : isEmployeeModule ? (
            <label>
              Cargo
              <input name="role" value={formData.role} onChange={handleChange} />
            </label>
          ) : (
            <label>
              Cor
              <input name="color" value={formData.color} onChange={handleChange} />
            </label>
          )}

          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : formData.id ? 'Atualizar funcionário' : 'Salvar registro'}
          </button>
          {isEmployeeModule && formData.id && (
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setEmployeeForm({ id: null, name: '', phone: '', document: '', role: '' })
              }
            >
              Cancelar edição
            </button>
          )}
        </form>

        <section className="panel customer-list">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">
                {isCustomerModule ? 'Base de clientes' : 'Registros'}
              </p>
              <h2>
                {isCustomerModule
                  ? 'Clientes cadastrados'
                  : isEmployeeModule
                    ? 'Funcionários ativos'
                    : selectedCustomerId
                      ? 'Veículos do cliente'
                      : 'Selecione um cliente'}
              </h2>
            </div>
          </div>

          {(isCustomerModule ? customers : isEmployeeModule ? employees : vehicles).length === 0 ? (
            <p className="empty-state">
              {isCustomerModule
                ? 'Nenhum cliente cadastrado ainda.'
                : isEmployeeModule
                  ? 'Nenhum funcionário cadastrado ainda.'
                  : selectedCustomerId
                    ? 'Nenhum veículo cadastrado para este cliente.'
                    : 'Selecione um cliente para consultar seus veículos.'}
            </p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {isCustomerModule ? (
                      <>
                        <th>Nome</th>
                        <th>Telefone</th>
                        <th>Documento</th>
                        <th>Endereço</th>
                      </>
                    ) : isEmployeeModule ? (
                      <>
                        <th>Nome</th>
                        <th>Telefone</th>
                        <th>Documento</th>
                        <th>Cargo</th>
                        <th>Ações</th>
                      </>
                    ) : (
                      <>
                        <th>Placa</th>
                        <th>Marca</th>
                        <th>Modelo</th>
                        <th>Ano</th>
                        <th>Cor</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {isCustomerModule
                    ? customers.map((customer) => (
                        <tr key={customer.id}>
                          <td>{customer.name}</td>
                          <td>{customer.phone || '-'}</td>
                          <td>{customer.document || '-'}</td>
                          <td>{customer.address || '-'}</td>
                        </tr>
                      ))
                    : isEmployeeModule
                      ? employees.map((employee) => (
                          <tr key={employee.id}>
                            <td>{employee.name}</td>
                            <td>{employee.phone || '-'}</td>
                            <td>{employee.document || '-'}</td>
                            <td>{employee.role || '-'}</td>
                            <td className="row-actions">
                              <button type="button" onClick={() => handleEditEmployee(employee)}>
                                Editar
                              </button>
                              <button
                                type="button"
                                className="danger-button"
                                onClick={() => handleDeleteEmployee(employee.id)}
                              >
                                Desativar
                              </button>
                            </td>
                          </tr>
                        ))
                      : vehicles.map((vehicle) => (
                          <tr key={vehicle.id}>
                            <td>{vehicle.license_plate}</td>
                            <td>{vehicle.brand || '-'}</td>
                            <td>
                              {[vehicle.brand, vehicle.model].filter(Boolean).join(' ') || '-'}
                            </td>
                            <td>{vehicle.year || '-'}</td>
                            <td>{vehicle.color || '-'}</td>
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
