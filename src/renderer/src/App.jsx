import { useEffect, useState } from 'react'

function App() {
  const [activeModule, setActiveModule] = useState('customers')
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [parts, setParts] = useState([])
  const [serviceOrders, setServiceOrders] = useState([])
  const [selectedServiceOrderId, setSelectedServiceOrderId] = useState('')
  const [serviceOrderDetails, setServiceOrderDetails] = useState({ parts: [], labor: [] })
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [serviceOrderVehicles, setServiceOrderVehicles] = useState([])
  const [customerForm, setCustomerForm] = useState({
    id: null,
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
    id: null,
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
  const [serviceOrderForm, setServiceOrderForm] = useState({
    customerId: '',
    vehicleId: '',
    employeeId: '',
    mileage: '',
    reportedDefect: '',
    mechanicNotes: '',
    status: 'Quote'
  })
  const [serviceOrderPartForm, setServiceOrderPartForm] = useState({
    partId: '',
    quantity: '1'
  })
  const [serviceOrderLaborForm, setServiceOrderLaborForm] = useState({
    description: '',
    laborCost: ''
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

  const loadServiceOrders = async () => {
    try {
      setServiceOrders(await window.api.getServiceOrders())
    } catch (loadError) {
      console.error(loadError)
      setError('Não foi possível carregar as ordens de serviço.')
    }
  }

  const loadServiceOrderDetails = async (serviceOrderId) => {
    try {
      setServiceOrderDetails(await window.api.getServiceOrderDetails(serviceOrderId))
    } catch (loadError) {
      console.error(loadError)
      setError('Não foi possível carregar os itens da ordem de serviço.')
    }
  }

  useEffect(() => {
    let isMounted = true

    Promise.all([
      window.api.getCustomers(),
      window.api.getEmployees(),
      window.api.getParts(),
      window.api.getServiceOrders()
    ])
      .then(([customerList, employeeList, partList, serviceOrderList]) => {
        if (isMounted) {
          setCustomers(customerList)
          setEmployees(employeeList)
          setParts(partList)
          setServiceOrders(serviceOrderList)
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
            : activeModule === 'parts'
              ? setPartForm
              : setServiceOrderForm
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
            : activeModule === 'parts'
              ? partForm
              : serviceOrderForm

    if (activeModule === 'vehicles' && !formData.customerId) {
      setError('Selecione um cliente para o veículo.')
      return
    }

    if (activeModule === 'service-orders' && !formData.customerId) {
      setError('Selecione um cliente para a ordem de serviço.')
      return
    }

    if (activeModule === 'service-orders' && !formData.vehicleId) {
      setError('Selecione um veículo para a ordem de serviço.')
      return
    }

    if (activeModule === 'service-orders' && !formData.reportedDefect.trim()) {
      setError('Informe o defeito relatado pelo cliente.')
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
        if (customerForm.id) {
          await window.api.updateCustomer(formData)
        } else {
          await window.api.saveCustomer(formData)
        }
        setCustomerForm({ id: null, name: '', phone: '', document: '', address: '' })
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
        if (vehicleForm.id) {
          await window.api.updateVehicle(formData)
        } else {
          await window.api.saveVehicle(formData)
        }
        setVehicleForm({
          id: null,
          customerId: selectedCustomerId,
          licensePlate: '',
          brand: '',
          model: '',
          year: '',
          color: ''
        })
        await loadVehicles(selectedCustomerId)
      } else if (activeModule === 'parts') {
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
      } else if (activeModule === 'service-orders') {
        await window.api.saveServiceOrder(formData)
        setServiceOrderForm({
          customerId: '',
          vehicleId: '',
          employeeId: '',
          mileage: '',
          reportedDefect: '',
          mechanicNotes: '',
          status: 'Quote'
        })
        setServiceOrderVehicles([])
        await loadServiceOrders()
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
                : activeModule === 'parts'
                  ? 'peça'
                  : 'ordem de serviço'
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

  const handleServiceOrderCustomerSelection = async ({ target }) => {
    const customerId = target.value
    setServiceOrderForm((currentData) => ({
      ...currentData,
      customerId,
      vehicleId: ''
    }))
    setError('')
    setServiceOrderVehicles([])

    if (customerId) {
      setServiceOrderVehicles(await window.api.getVehiclesByCustomer(customerId))
    }
  }

  const handleServiceOrderSelection = async (serviceOrderId) => {
    setSelectedServiceOrderId(serviceOrderId)
    setError('')
    await loadServiceOrderDetails(serviceOrderId)
  }

  const handleServiceOrderStatus = async (serviceOrderId, status) => {
    const action = status === 'Completed' ? 'concluir' : 'cancelar'
    if (!window.confirm(`Deseja ${action} esta ordem de serviço?`)) {
      return
    }

    try {
      setError('')
      await window.api.updateServiceOrderStatus({ serviceOrderId, status })
      await loadServiceOrders()
    } catch (statusError) {
      console.error(statusError)
      setError('Não foi possível atualizar o status da ordem de serviço.')
    }
  }

  const handleAddServiceOrderPart = async (event) => {
    event.preventDefault()

    if (!serviceOrderPartForm.partId || Number(serviceOrderPartForm.quantity) <= 0) {
      setError('Selecione uma peça e informe uma quantidade válida.')
      return
    }

    try {
      setError('')
      await window.api.addServiceOrderPart({
        serviceOrderId: selectedServiceOrderId,
        partId: serviceOrderPartForm.partId,
        quantity: serviceOrderPartForm.quantity
      })
      setServiceOrderPartForm({ partId: '', quantity: '1' })
      await Promise.all([
        loadServiceOrderDetails(selectedServiceOrderId),
        loadParts(),
        loadServiceOrders()
      ])
    } catch (itemError) {
      console.error(itemError)
      setError('Não foi possível adicionar a peça à ordem de serviço.')
    }
  }

  const handleAddServiceOrderLabor = async (event) => {
    event.preventDefault()

    if (!serviceOrderLaborForm.description.trim() || Number(serviceOrderLaborForm.laborCost) < 0) {
      setError('Informe a descrição e um custo válido para a mão de obra.')
      return
    }

    try {
      setError('')
      await window.api.addServiceOrderLabor({
        serviceOrderId: selectedServiceOrderId,
        description: serviceOrderLaborForm.description,
        laborCost: serviceOrderLaborForm.laborCost
      })
      setServiceOrderLaborForm({ description: '', laborCost: '' })
      await Promise.all([loadServiceOrderDetails(selectedServiceOrderId), loadServiceOrders()])
    } catch (itemError) {
      console.error(itemError)
      setError('Não foi possível adicionar a mão de obra à ordem de serviço.')
    }
  }

  const handleRemoveServiceOrderPart = async (itemId) => {
    if (!window.confirm('Deseja remover esta peça da ordem de serviço?')) {
      return
    }

    try {
      setError('')
      await window.api.removeServiceOrderPart(itemId)
      await Promise.all([
        loadServiceOrderDetails(selectedServiceOrderId),
        loadParts(),
        loadServiceOrders()
      ])
    } catch (itemError) {
      console.error(itemError)
      setError('Não foi possível remover a peça da ordem de serviço.')
    }
  }

  const handleRemoveServiceOrderLabor = async (itemId) => {
    if (!window.confirm('Deseja remover esta mão de obra da ordem de serviço?')) {
      return
    }

    try {
      setError('')
      await window.api.removeServiceOrderLabor(itemId)
      await Promise.all([loadServiceOrderDetails(selectedServiceOrderId), loadServiceOrders()])
    } catch (itemError) {
      console.error(itemError)
      setError('Não foi possível remover a mão de obra da ordem de serviço.')
    }
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

  const handleEditCustomer = (customer) => {
    setActiveModule('customers')
    setError('')
    setCustomerForm({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || '',
      document: customer.document || '',
      address: customer.address || ''
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

  const handleEditVehicle = (vehicle) => {
    setActiveModule('vehicles')
    setSelectedCustomerId(String(vehicle.customer_id))
    setError('')
    setVehicleForm({
      id: vehicle.id,
      customerId: String(vehicle.customer_id),
      licensePlate: vehicle.license_plate,
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      color: vehicle.color || ''
    })
  }

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Deseja excluir este veículo?')) {
      return
    }

    try {
      setError('')
      await window.api.deleteVehicle(vehicleId)
      await loadVehicles(selectedCustomerId)
    } catch (deleteError) {
      console.error(deleteError)
      setError('Não foi possível excluir o veículo. Ele pode possuir histórico de OS.')
    }
  }

  const isCustomerModule = activeModule === 'customers'
  const isEmployeeModule = activeModule === 'employees'
  const isVehicleModule = activeModule === 'vehicles'
  const isServiceOrderModule = activeModule === 'service-orders'
  const formData = isCustomerModule
    ? customerForm
    : isEmployeeModule
      ? employeeForm
      : isVehicleModule
        ? vehicleForm
        : activeModule === 'parts'
          ? partForm
          : serviceOrderForm
  const moduleLabel = isCustomerModule
    ? 'Clientes'
    : isEmployeeModule
      ? 'Funcionários'
      : isVehicleModule
        ? 'Veículos'
        : activeModule === 'parts'
          ? 'Peças e estoque'
          : 'Ordens de serviço'

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
                  : activeModule === 'parts'
                    ? 'Controle peças, estoque e preços de venda.'
                    : 'Abra e acompanhe as ordens da oficina.'}
          </p>
        </div>
        <span className="customer-count">
          {isCustomerModule
            ? customers.length
            : isEmployeeModule
              ? employees.length
              : isVehicleModule
                ? vehicles.length
                : activeModule === 'parts'
                  ? parts.length
                  : serviceOrders.length}{' '}
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
          className={isEmployeeModule ? 'active' : ''}
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
        <button
          type="button"
          className={isServiceOrderModule ? 'active' : ''}
          onClick={() => {
            setActiveModule('service-orders')
            setError('')
          }}
        >
          Ordens de serviço
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
                            : activeModule === 'parts'
                              ? 'peça'
                              : 'ordem de serviço'
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
          ) : isServiceOrderModule ? (
            <>
              <label>
                Cliente
                <select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleServiceOrderCustomerSelection}
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Veículo
                <select
                  name="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione um veículo</option>
                  {serviceOrderVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate} - {vehicle.brand || ''} {vehicle.model || ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Funcionário responsável
                <select name="employeeId" value={formData.employeeId} onChange={handleChange}>
                  <option value="">Não atribuído</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quilometragem
                <input
                  name="mileage"
                  type="number"
                  min="0"
                  value={formData.mileage}
                  onChange={handleChange}
                />
              </label>
              <label>
                Defeito relatado
                <textarea
                  name="reportedDefect"
                  value={formData.reportedDefect}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Observações do mecânico
                <textarea
                  name="mechanicNotes"
                  value={formData.mechanicNotes}
                  onChange={handleChange}
                />
              </label>
              <label>
                Status
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="Quote">Orçamento</option>
                  <option value="Open">Aberta</option>
                  <option value="In Progress">Em andamento</option>
                  <option value="Completed">Concluída</option>
                  <option value="Canceled">Cancelada</option>
                </select>
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
            {isSaving
              ? 'Salvando...'
              : formData.id
                ? isCustomerModule
                  ? 'Atualizar cliente'
                  : 'Atualizar funcionário'
                : 'Salvar registro'}
          </button>
          {(isCustomerModule || isEmployeeModule || isVehicleModule || activeModule === 'parts') &&
            formData.id && (
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  isCustomerModule
                    ? setCustomerForm({ id: null, name: '', phone: '', document: '', address: '' })
                    : isVehicleModule
                      ? setVehicleForm({
                          id: null,
                          customerId: selectedCustomerId,
                          licensePlate: '',
                          brand: '',
                          model: '',
                          year: '',
                          color: ''
                        })
                      : isEmployeeModule
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
                      : activeModule === 'parts'
                        ? 'Peças cadastradas'
                        : 'Ordens de serviço'}
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
                    : activeModule === 'parts'
                      ? 'Nenhuma peça cadastrada ainda.'
                      : 'Nenhuma ordem de serviço cadastrada ainda.'}
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
                        <th>Ações</th>
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
                        <th>Ações</th>
                      </>
                    ) : activeModule === 'parts' ? (
                      <>
                        <th>Código</th>
                        <th>Descrição</th>
                        <th>Estoque</th>
                        <th>Custo</th>
                        <th>Venda</th>
                        <th>Ações</th>
                      </>
                    ) : (
                      <>
                        <th>OS</th>
                        <th>Cliente</th>
                        <th>Veículo</th>
                        <th>Responsável</th>
                        <th>Status</th>
                        <th>Entrada</th>
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
                          <td className="row-actions">
                            <button type="button" onClick={() => handleEditCustomer(customer)}>
                              Editar
                            </button>
                          </td>
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
                              <td className="row-actions">
                                <button type="button" onClick={() => handleEditVehicle(vehicle)}>
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  className="danger-button"
                                  onClick={() => handleDeleteVehicle(vehicle.id)}
                                >
                                  Excluir
                                </button>
                              </td>
                            </tr>
                          ))
                        : activeModule === 'parts'
                          ? parts.map((part) => (
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
                            ))
                          : serviceOrders.map((serviceOrder) => (
                              <tr key={serviceOrder.id}>
                                <td>
                                  <button
                                    type="button"
                                    className="table-link"
                                    onClick={() => handleServiceOrderSelection(serviceOrder.id)}
                                  >
                                    #{serviceOrder.id}
                                  </button>
                                </td>
                                <td>{serviceOrder.customer_name}</td>
                                <td>
                                  {serviceOrder.license_plate} - {serviceOrder.brand || ''}{' '}
                                  {serviceOrder.model || ''}
                                </td>
                                <td>{serviceOrder.employee_name || 'Não atribuído'}</td>
                                <td>{serviceOrder.status}</td>
                                <td>{serviceOrder.entry_date}</td>
                                <td className="row-actions">
                                  {!['Completed', 'Canceled'].includes(serviceOrder.status) && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleServiceOrderStatus(serviceOrder.id, 'Completed')
                                        }
                                      >
                                        Concluir
                                      </button>
                                      <button
                                        type="button"
                                        className="danger-button"
                                        onClick={() =>
                                          handleServiceOrderStatus(serviceOrder.id, 'Canceled')
                                        }
                                      >
                                        Cancelar
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {isServiceOrderModule && selectedServiceOrderId && (
        <section className="service-order-details">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Detalhamento</p>
              <h2>Itens da OS #{selectedServiceOrderId}</h2>
            </div>
            <strong className="service-order-total">
              Total: R${' '}
              {Number(
                serviceOrders.find((order) => order.id === Number(selectedServiceOrderId))
                  ?.total_amount || 0
              ).toFixed(2)}
            </strong>
          </div>

          <div className="details-grid">
            <form className="item-form" onSubmit={handleAddServiceOrderPart}>
              <h3>Adicionar peça</h3>
              <label>
                Peça
                <select
                  value={serviceOrderPartForm.partId}
                  onChange={({ target }) =>
                    setServiceOrderPartForm((currentData) => ({
                      ...currentData,
                      partId: target.value
                    }))
                  }
                  required
                >
                  <option value="">Selecione uma peça</option>
                  {parts.map((part) => (
                    <option key={part.id} value={part.id}>
                      {part.description} ({part.stock_quantity} em estoque)
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantidade
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={serviceOrderPartForm.quantity}
                  onChange={({ target }) =>
                    setServiceOrderPartForm((currentData) => ({
                      ...currentData,
                      quantity: target.value
                    }))
                  }
                />
              </label>
              <button type="submit">Adicionar peça</button>
            </form>

            <form className="item-form" onSubmit={handleAddServiceOrderLabor}>
              <h3>Adicionar mão de obra</h3>
              <label>
                Descrição
                <input
                  value={serviceOrderLaborForm.description}
                  onChange={({ target }) =>
                    setServiceOrderLaborForm((currentData) => ({
                      ...currentData,
                      description: target.value
                    }))
                  }
                  required
                />
              </label>
              <label>
                Custo
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={serviceOrderLaborForm.laborCost}
                  onChange={({ target }) =>
                    setServiceOrderLaborForm((currentData) => ({
                      ...currentData,
                      laborCost: target.value
                    }))
                  }
                  required
                />
              </label>
              <button type="submit">Adicionar mão de obra</button>
            </form>
          </div>

          <div className="details-grid">
            <div>
              <h3>Peças utilizadas</h3>
              {serviceOrderDetails.parts.length === 0 ? (
                <p className="empty-state">Nenhuma peça adicionada.</p>
              ) : (
                <ul className="detail-list">
                  {serviceOrderDetails.parts.map((item) => (
                    <li key={item.id}>
                      <span>
                        {item.description} x {item.quantity}
                      </span>
                      <span className="detail-actions">
                        <strong>R$ {(item.quantity * item.unit_price).toFixed(2)}</strong>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleRemoveServiceOrderPart(item.id)}
                        >
                          Remover
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3>Mão de obra</h3>
              {serviceOrderDetails.labor.length === 0 ? (
                <p className="empty-state">Nenhuma mão de obra adicionada.</p>
              ) : (
                <ul className="detail-list">
                  {serviceOrderDetails.labor.map((item) => (
                    <li key={item.id}>
                      <span>{item.description}</span>
                      <span className="detail-actions">
                        <strong>R$ {Number(item.labor_cost).toFixed(2)}</strong>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleRemoveServiceOrderLabor(item.id)}
                        >
                          Remover
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

export default App
