import { useEffect, useState } from 'react'

function App() {
  const [activeModule, setActiveModule] = useState('customers')
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [parts, setParts] = useState([])
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
  const [partForm, setPartForm] = useState({
    id: null,
    internalCode: '',
    description: '',
    stockQuantity: '0',
    costPrice: '0',
    sellingPrice: '0'
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

  const loadParts = async () => {
    try {
      setParts(await window.api.getParts())
    } catch (loadError) {
      console.error(loadError)
      setError('Não foi possível carregar as peças.')
    }
  }

  useEffect(() => {
    let isMounted = true

    Promise.all([window.api.getCustomers(), window.api.getEmployees(), window.api.getParts()])
      .then(([customerList, employeeList, partList]) => {
        if (isMounted) {
          setCustomers(customerList)
          setEmployees(employeeList)
          setParts(partList)
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
          : activeModule === 'vehicles'
            ? setVehicleForm
            : setPartForm
    updateForm((currentData) => ({ ...currentData, [target.name]: target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const formData =
      activeModule === 'customers'
        ? customerForm
        : activeModule === 'employees'
          ? employeeForm
          : activeModule === 'vehicles'
            ? vehicleForm
            : partForm

    if (activeModule === 'vehicles' && !formData.customerId) {
      setError('Selecione um cliente para o veículo.')
      return
    }

    if (activeModule === 'parts' && !formData.description.trim()) {
      setError('Informe a descrição da peça.')
      return
    }

    if (activeModule === 'vehicles' && (!formData.licensePlate || !formData.licensePlate.trim())) {
      setError('Informe a placa do veículo.')
      return
    }

    if (!['vehicles', 'parts'].includes(activeModule) && !formData.name.trim()) {
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
      } else if (activeModule === 'vehicles') {
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
      } else {
        if (partForm.id) {
          await window.api.updatePart(formData)
        } else {
          await window.api.savePart(formData)
        }
        setPartForm({
          id: null,
          internalCode: '',
          description: '',
          stockQuantity: '0',
          costPrice: '0',
          sellingPrice: '0'
        })
        await loadParts()
      }
    } catch (saveError) {
      console.error(saveError)
      setError(
        `Não foi possível salvar o ${
          activeModule === 'customers'
            ? 'cliente'
            : activeModule === 'employees'
              ? 'funcionário'
              : activeModule === 'vehicles'
                ? 'veículo'
                : 'peça'
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

  const handleEditPart = (part) => {
    setActiveModule('parts')
    setError('')
    setPartForm({
      id: part.id,
      internalCode: part.internal_code || '',
      description: part.description,
      stockQuantity: String(part.stock_quantity),
      costPrice: String(part.cost_price),
      sellingPrice: String(part.selling_price)
    })
  }

  const isCustomerModule = activeModule === 'customers'
  const isEmployeeModule = activeModule === 'employees'
  const isVehicleModule = activeModule === 'vehicles'
  const formData = isCustomerModule
    ? customerForm
    : isEmployeeModule
      ? employeeForm
      : isVehicleModule
        ? vehicleForm
        : partForm
  const moduleLabel = isCustomerModule
    ? 'Clientes'
    : isEmployeeModule
      ? 'Funcionários'
      : isVehicleModule
        ? 'Veículos'
        : 'Peças e estoque'

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
                : isVehicleModule
                  ? 'Cadastre veículos vinculados aos clientes.'
                  : 'Controle peças, estoque e preços de venda.'}
          </p>
        </div>
        <span className="customer-count">
          {isCustomerModule
            ? customers.length
            : isEmployeeModule
              ? employees.length
              : isVehicleModule
                ? vehicles.length
                : parts.length}{' '}
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
        <button
          type="button"
          className={activeModule === 'parts' ? 'active' : ''}
          onClick={() => {
            setActiveModule('parts')
            setError('')
          }}
        >
          Peças
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
                  : `Cadastrar ${
                      isCustomerModule
                        ? 'cliente'
                        : isEmployeeModule
                          ? 'funcionário'
                          : isVehicleModule
                            ? 'veículo'
                            : 'peça'
                    }`}
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
          ) : isVehicleModule ? (
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
          ) : (
            <>
              <label>
                Código interno
                <input name="internalCode" value={formData.internalCode} onChange={handleChange} />
              </label>
              <label>
                Descrição
                <input
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Quantidade em estoque
                <input
                  name="stockQuantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                />
              </label>
              <label>
                Preço de custo
                <input
                  name="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={handleChange}
                />
              </label>
              <label>
                Preço de venda
                <input
                  name="sellingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={handleChange}
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
          ) : isVehicleModule ? (
            <label>
              Cor
              <input name="color" value={formData.color} onChange={handleChange} />
            </label>
          ) : null}

          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : formData.id ? 'Atualizar funcionário' : 'Salvar registro'}
          </button>
          {(isEmployeeModule || activeModule === 'parts') && formData.id && (
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                isEmployeeModule
                  ? setEmployeeForm({ id: null, name: '', phone: '', document: '', role: '' })
                  : setPartForm({
                      id: null,
                      internalCode: '',
                      description: '',
                      stockQuantity: '0',
                      costPrice: '0',
                      sellingPrice: '0'
                    })
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
                    : isVehicleModule
                      ? selectedCustomerId
                        ? 'Veículos do cliente'
                        : 'Selecione um cliente'
                      : 'Peças cadastradas'}
              </h2>
            </div>
          </div>

          {(isCustomerModule
            ? customers
            : isEmployeeModule
              ? employees
              : isVehicleModule
                ? vehicles
                : parts
          ).length === 0 ? (
            <p className="empty-state">
              {isCustomerModule
                ? 'Nenhum cliente cadastrado ainda.'
                : isEmployeeModule
                  ? 'Nenhum funcionário cadastrado ainda.'
                  : isVehicleModule
                    ? selectedCustomerId
                      ? 'Nenhum veículo cadastrado para este cliente.'
                      : 'Selecione um cliente para consultar seus veículos.'
                    : 'Nenhuma peça cadastrada ainda.'}
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
                    ) : isVehicleModule ? (
                      <>
                        <th>Placa</th>
                        <th>Marca</th>
                        <th>Modelo</th>
                        <th>Ano</th>
                        <th>Cor</th>
                      </>
                    ) : (
                      <>
                        <th>Código</th>
                        <th>Descrição</th>
                        <th>Estoque</th>
                        <th>Custo</th>
                        <th>Venda</th>
                        <th>Ações</th>
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
                      : isVehicleModule
                        ? vehicles.map((vehicle) => (
                            <tr key={vehicle.id}>
                              <td>{vehicle.license_plate}</td>
                              <td>{vehicle.brand || '-'}</td>
                              <td>{vehicle.model || '-'}</td>
                              <td>{vehicle.year || '-'}</td>
                              <td>{vehicle.color || '-'}</td>
                            </tr>
                          ))
                        : parts.map((part) => (
                            <tr key={part.id}>
                              <td>{part.internal_code || '-'}</td>
                              <td>{part.description}</td>
                              <td>{part.stock_quantity}</td>
                              <td>R$ {Number(part.cost_price).toFixed(2)}</td>
                              <td>R$ {Number(part.selling_price).toFixed(2)}</td>
                              <td className="row-actions">
                                <button type="button" onClick={() => handleEditPart(part)}>
                                  Editar
                                </button>
                              </td>
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
