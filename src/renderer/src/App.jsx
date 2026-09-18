/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'

const blank = {
  customer: { id: null, name: '', phone: '', document: '', address: '' },
  employee: { id: null, name: '', phone: '', document: '', role: '' },
  vehicle: {
    id: null,
    customerId: '',
    licensePlate: '',
    brand: '',
    model: '',
    year: '',
    color: ''
  },
  part: {
    id: null,
    internalCode: '',
    description: '',
    stockQuantity: '0',
    costPrice: '0',
    sellingPrice: '0'
  },
  order: {
    customerId: '',
    vehicleId: '',
    employeeId: '',
    mileage: '',
    reportedDefect: '',
    mechanicNotes: '',
    status: 'Quote'
  }
}

const navigation = [
  ['dashboard', 'Visao geral'],
  ['service-orders', 'Ordens de servico'],
  ['customers', 'Clientes'],
  ['vehicles', 'Veiculos'],
  ['parts', 'Pecas e estoque'],
  ['employees', 'Funcionarios']
]

function App() {
  const [view, setView] = useState('dashboard')
  const [customers, setCustomers] = useState([])
  const [employees, setEmployees] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [parts, setParts] = useState([])
  const [orders, setOrders] = useState([])
  const [forms, setForms] = useState(blank)
  const [orderVehicles, setOrderVehicles] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [details, setDetails] = useState({ parts: [], labor: [] })
  const [partItem, setPartItem] = useState({ partId: '', quantity: '1' })
  const [laborItem, setLaborItem] = useState({ description: '', laborCost: '' })
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')

  const notify = (type, message) => {
    setNotice({ type, message })
    window.setTimeout(() => setNotice(null), 4000)
  }

  const fetchAll = () =>
    Promise.all([
      window.api.getCustomers(),
      window.api.getEmployees(),
      window.api.getParts(),
      window.api.getServiceOrders()
    ])

  const applyData = ([customerList, employeeList, partList, orderList]) => {
    setCustomers(customerList)
    setEmployees(employeeList)
    setParts(partList)
    setOrders(orderList)
  }

  const loadAll = async () => {
    try {
      applyData(await fetchAll())
    } catch (error) {
      console.error(error)
      notify('error', 'Nao foi possivel carregar os dados.')
    }
  }

  useEffect(() => {
    let mounted = true
    fetchAll()
      .then((data) => {
        if (mounted) applyData(data)
      })
      .catch((error) => {
        console.error(error)
        if (mounted) notify('error', 'Nao foi possivel carregar os dados.')
      })

    return () => {
      mounted = false
    }
  }, [])

  const changeView = (nextView) => {
    setView(nextView)
    setNotice(null)
  }

  const searchTerm = globalSearch.trim().toLowerCase()
  const searchResults = searchTerm
    ? [
        ...customers
          .filter((item) =>
            [item.name, item.phone, item.document].some((value) =>
              value?.toLowerCase().includes(searchTerm)
            )
          )
          .map((item) => ({
            type: 'Cliente',
            label: item.name,
            detail: item.phone || item.document || '',
            view: 'customers',
            id: item.id
          })),
        ...orders
          .filter((item) =>
            [item.customer_name, item.license_plate, String(item.id)].some((value) =>
              value?.toLowerCase().includes(searchTerm)
            )
          )
          .map((item) => ({
            type: 'OS',
            label: `OS #${item.id}`,
            detail: `${item.customer_name} · ${item.license_plate}`,
            view: 'service-orders',
            id: item.id
          })),
        ...vehicles
          .filter((item) =>
            [item.license_plate, item.brand, item.model].some((value) =>
              value?.toLowerCase().includes(searchTerm)
            )
          )
          .map((item) => ({
            type: 'Veículo',
            label: item.license_plate,
            detail: `${item.brand || ''} ${item.model || ''}`,
            view: 'vehicles',
            id: item.id
          }))
      ].slice(0, 8)
    : []

  const openSearchResult = async (result) => {
    setGlobalSearch('')
    changeView(result.view)
    if (result.view === 'service-orders') await openOrder(result.id)
  }

  const updateForm = (type, field, value) => {
    setForms((current) => ({ ...current, [type]: { ...current[type], [field]: value } }))
  }

  const resetForm = (type) => setForms((current) => ({ ...current, [type]: { ...blank[type] } }))

  const saveRecord = async (event, type) => {
    event.preventDefault()
    const data = forms[type]
    const required =
      type === 'customer' || type === 'employee'
        ? data.name
        : type === 'vehicle'
          ? data.customerId && data.licensePlate
          : data.description
    if (!required) return notify('error', 'Preencha os campos obrigatorios.')
    setSaving(true)
    try {
      if (type === 'customer')
        data.id ? await window.api.updateCustomer(data) : await window.api.saveCustomer(data)
      if (type === 'employee')
        data.id ? await window.api.updateEmployee(data) : await window.api.saveEmployee(data)
      if (type === 'vehicle')
        data.id ? await window.api.updateVehicle(data) : await window.api.saveVehicle(data)
      if (type === 'part')
        data.id ? await window.api.updatePart(data) : await window.api.savePart(data)
      resetForm(type)
      await loadAll()
      if (type === 'vehicle' && data.customerId) await loadVehicles(data.customerId)
      notify('success', 'Registro salvo com sucesso.')
    } catch (error) {
      console.error(error)
      notify('error', 'Nao foi possivel salvar o registro.')
    } finally {
      setSaving(false)
    }
  }

  const loadVehicles = async (customerId) => {
    setVehicles(customerId ? await window.api.getVehiclesByCustomer(customerId) : [])
    updateForm('vehicle', 'customerId', customerId)
  }

  const selectOrderCustomer = async (customerId) => {
    updateForm('order', 'customerId', customerId)
    updateForm('order', 'vehicleId', '')
    setOrderVehicles(customerId ? await window.api.getVehiclesByCustomer(customerId) : [])
  }

  const saveOrder = async (event) => {
    event.preventDefault()
    const data = forms.order
    if (!data.customerId || !data.vehicleId || !data.reportedDefect)
      return notify('error', 'Cliente, veiculo e defeito sao obrigatorios.')
    try {
      await window.api.saveServiceOrder(data)
      resetForm('order')
      setOrderVehicles([])
      await loadAll()
      notify('success', 'Ordem de servico aberta.')
    } catch (error) {
      console.error(error)
      notify('error', 'Nao foi possivel abrir a ordem.')
    }
  }

  const openOrder = async (orderId) => {
    setSelectedOrder(orderId)
    setDetails(await window.api.getServiceOrderDetails(orderId))
  }

  const addPart = async (event) => {
    event.preventDefault()
    try {
      await window.api.addServiceOrderPart({
        serviceOrderId: selectedOrder,
        partId: partItem.partId,
        quantity: partItem.quantity
      })
      setPartItem({ partId: '', quantity: '1' })
      await loadAll()
      setDetails(await window.api.getServiceOrderDetails(selectedOrder))
      notify('success', 'Peca adicionada a OS.')
    } catch (error) {
      console.error(error)
      notify('error', 'Nao foi possivel adicionar a peca.')
    }
  }

  const addLabor = async (event) => {
    event.preventDefault()
    try {
      await window.api.addServiceOrderLabor({ serviceOrderId: selectedOrder, ...laborItem })
      setLaborItem({ description: '', laborCost: '' })
      await loadAll()
      setDetails(await window.api.getServiceOrderDetails(selectedOrder))
      notify('success', 'Mao de obra adicionada a OS.')
    } catch (error) {
      console.error(error)
      notify('error', 'Nao foi possivel adicionar a mao de obra.')
    }
  }

  const changeStatus = async (orderId, status) => {
    try {
      await window.api.updateServiceOrderStatus({ serviceOrderId: orderId, status })
      await loadAll()
      notify('success', 'Status atualizado.')
    } catch (error) {
      console.error(error)
      notify('error', 'Nao foi possivel atualizar o status.')
    }
  }

  const orderAction = (action) => {
    if (action === 'print') window.print()
    if (action === 'whatsapp') notify('success', 'Resumo preparado para envio via WhatsApp.')
    if (action === 'finish' && selectedOrder) changeStatus(selectedOrder, 'Completed')
  }

  const edit = (type, record) => setForms((current) => ({ ...current, [type]: record }))
  const deactivateEmployee = async (id) => {
    if (window.confirm('Desativar este funcionario?')) {
      await window.api.deleteEmployee(id)
      await loadAll()
      notify('success', 'Funcionario desativado.')
    }
  }
  const removeVehicle = async (id) => {
    if (window.confirm('Excluir este veiculo?')) {
      try {
        await window.api.deleteVehicle(id)
        await loadVehicles(forms.vehicle.customerId)
        notify('success', 'Veiculo excluido.')
      } catch {
        notify('error', 'Veiculo com historico de OS nao pode ser excluido.')
      }
    }
  }

  const labels = {
    dashboard: 'Visao geral',
    customers: 'Clientes',
    employees: 'Funcionarios',
    vehicles: 'Veiculos',
    parts: 'Pecas e estoque',
    'service-orders': 'Ordens de servico'
  }

  return (
    <div className="workspace">
      <aside className="sidebar">
        <div className="brand">
          <span>OS</span>
          <div>
            <strong>OS Oficina</strong>
            <small>gestao de oficina</small>
          </div>
        </div>
        <p className="nav-title">Area de trabalho</p>
        <nav>
          {navigation.map(([id, label], index) => (
            <button
              type="button"
              key={id}
              className={view === id ? 'nav-link active' : 'nav-link'}
              onClick={() => changeView(id)}
            >
              <span>0{index + 1}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="connection">
          <i />{' '}
          <div>
            <strong>Banco local</strong>
            <small>conectado</small>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <small>PAINEL OPERACIONAL</small>
            <p>
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
          </div>
          <div className="global-search">
            <span>⌕</span>
            <input
              value={globalSearch}
              onChange={({ target }) => setGlobalSearch(target.value)}
              placeholder="Buscar por placa, CPF ou nome..."
              aria-label="Busca global"
            />
            {globalSearch && (
              <button type="button" onClick={() => setGlobalSearch('')}>
                ×
              </button>
            )}
            {globalSearch && (
              <div className="search-results">
                {searchResults.length ? (
                  searchResults.map((result) => (
                    <button
                      type="button"
                      key={`${result.type}-${result.id}`}
                      onClick={() => openSearchResult(result)}
                    >
                      <span>{result.type}</span>
                      <strong>{result.label}</strong>
                      <small>{result.detail}</small>
                    </button>
                  ))
                ) : (
                  <p>Nenhum registro encontrado.</p>
                )}
              </div>
            )}
          </div>
          <div className="profile">
            <b>OF</b> Oficina local
          </div>
        </header>
        {notice && <div className={`notice ${notice.type}`}>{notice.message}</div>}
        {view === 'dashboard' ? (
          <Dashboard
            stats={{
              customers: customers.length,
              vehicles: vehicles.length,
              parts: parts.length,
              orders: orders.filter((item) => !['Completed', 'Canceled'].includes(item.status))
                .length
            }}
            orders={orders}
            parts={parts}
            onOpen={changeView}
            onSelectOrder={openOrder}
          />
        ) : (
          <>
            <header className="view-heading">
              <small>
                MODULO {String(navigation.findIndex(([id]) => id === view) + 1).padStart(2, '0')}
              </small>
              <h1>{labels[view]}</h1>
              <p>
                {view === 'service-orders'
                  ? 'Acompanhe o trabalho desde a entrada ate a entrega.'
                  : 'Organize as informacoes da oficina com clareza.'}
              </p>
            </header>
            {view === 'customers' && (
              <CustomerModule
                data={customers}
                form={forms.customer}
                update={(f, v) => updateForm('customer', f, v)}
                submit={(e) => saveRecord(e, 'customer')}
                edit={(item) => edit('customer', item)}
                reset={() => resetForm('customer')}
                saving={saving}
              />
            )}
            {view === 'employees' && (
              <EmployeeModule
                data={employees}
                form={forms.employee}
                update={(f, v) => updateForm('employee', f, v)}
                submit={(e) => saveRecord(e, 'employee')}
                edit={(item) => edit('employee', item)}
                remove={deactivateEmployee}
                reset={() => resetForm('employee')}
                saving={saving}
              />
            )}
            {view === 'vehicles' && (
              <VehicleModule
                customers={customers}
                data={vehicles}
                form={forms.vehicle}
                update={(f, v) => updateForm('vehicle', f, v)}
                onCustomer={loadVehicles}
                submit={(e) => saveRecord(e, 'vehicle')}
                edit={(item) => edit('vehicle', { ...item, customerId: String(item.customer_id) })}
                remove={removeVehicle}
                reset={() => resetForm('vehicle')}
                saving={saving}
              />
            )}
            {view === 'parts' && (
              <PartModule
                data={parts}
                form={forms.part}
                update={(f, v) => updateForm('part', f, v)}
                submit={(e) => saveRecord(e, 'part')}
                edit={(item) =>
                  edit('part', {
                    id: item.id,
                    internalCode: item.internal_code || '',
                    description: item.description,
                    stockQuantity: String(item.stock_quantity),
                    costPrice: String(item.cost_price),
                    sellingPrice: String(item.selling_price)
                  })
                }
                reset={() => resetForm('part')}
                saving={saving}
              />
            )}
            {view === 'service-orders' && (
              <OrderModule
                customers={customers}
                employees={employees}
                vehicles={orderVehicles}
                orders={orders}
                form={forms.order}
                update={(f, v) => updateForm('order', f, v)}
                onCustomer={selectOrderCustomer}
                submit={saveOrder}
                select={openOrder}
                selected={selectedOrder}
                status={changeStatus}
                details={details}
                parts={parts}
                partItem={partItem}
                setPartItem={setPartItem}
                laborItem={laborItem}
                setLaborItem={setLaborItem}
                addPart={addPart}
                addLabor={addLabor}
                onAction={orderAction}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}

function Dashboard({ stats, orders, parts, onOpen, onSelectOrder }) {
  return (
    <section className="dashboard">
      <div className="hero">
        <div>
          <small>RESUMO DE HOJE</small>
          <h1>
            Bom trabalho,
            <br />
            <em>vamos organizar a oficina.</em>
          </h1>
          <p>Uma visão objetiva do que está acontecendo agora.</p>
        </div>
        <button type="button" className="primary" onClick={() => onOpen('service-orders')}>
          + Abrir ordem de servico
        </button>
      </div>
      <div className="stats">
        {[
          ['Ordens em andamento', stats.orders, 'orange'],
          ['Clientes cadastrados', stats.customers, 'blue'],
          ['Veiculos na base', stats.vehicles, 'green'],
          ['Itens no estoque', stats.parts, 'purple']
        ].map(([label, value, color]) => (
          <div className={`stat ${color}`} key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
            <span>registros ativos</span>
          </div>
        ))}
      </div>
      <section className="card kanban-card">
        <CardTitle
          eyebrow="FLUXO DE TRABALHO"
          title="Quadro de serviços"
          action="Ver todas"
          onAction={() => onOpen('service-orders')}
        />
        <div className="kanban-board">
          {[
            ['Quote', 'Avaliando'],
            ['Open', 'Aguardando peças'],
            ['In Progress', 'Em execução'],
            ['Completed', 'Pronto para retirada'],
            ['Canceled', 'Finalizado']
          ].map(([status, label]) => (
            <div className="kanban-column" key={status}>
              <div className="kanban-heading">
                <span>{label}</span>
                <b>{orders.filter((item) => item.status === status).length}</b>
              </div>
              {orders
                .filter((item) => item.status === status)
                .slice(0, 4)
                .map((item) => (
                  <button
                    type="button"
                    className="kanban-item"
                    key={item.id}
                    onClick={() => {
                      onOpen('service-orders')
                      onSelectOrder(item.id)
                    }}
                  >
                    <strong>OS #{item.id}</strong>
                    <span>{item.license_plate}</span>
                    <small>{item.customer_name}</small>
                  </button>
                ))}
            </div>
          ))}
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="card recent">
          <CardTitle
            eyebrow="ATIVIDADE"
            title="Ordens recentes"
            action="Ver todas"
            onAction={() => onOpen('service-orders')}
          />
          {orders.length ? (
            <OrderTable orders={orders.slice(0, 5)} compact />
          ) : (
            <Empty title="Nenhuma ordem aberta" text="As novas ordens aparecerão aqui." />
          )}
        </section>
        <section className="card stock-card">
          <CardTitle eyebrow="ESTOQUE" title="Atenção necessária" />
          <div className="stock-summary">
            <b>!</b>
            <div>
              <strong>
                {parts.filter((item) => item.stock_quantity < 2).length} itens em estoque baixo
              </strong>
              <p>Revise o inventário antes dos próximos serviços.</p>
            </div>
          </div>
          <button type="button" className="outline" onClick={() => onOpen('parts')}>
            Abrir estoque
          </button>
        </section>
      </div>
    </section>
  )
}

function CustomerModule({ data, form, update, submit, edit, reset, saving }) {
  return (
    <ModuleLayout
      form={
        <Form
          title="cliente"
          eyebrow="CADASTRO"
          submit={submit}
          saving={saving}
          editing={form.id}
          reset={reset}
        >
          <Field
            label="Nome completo"
            value={form.name}
            onChange={(v) => update('name', v)}
            required
          />
          <Field label="Telefone" value={form.phone} onChange={(v) => update('phone', v)} />
          <Field
            label="CPF ou CNPJ"
            value={form.document}
            onChange={(v) => update('document', v)}
          />
          <Field label="Endereco" value={form.address} onChange={(v) => update('address', v)} />
        </Form>
      }
    >
      <DataCard title="Clientes cadastrados" count={data.length}>
        {data.length ? (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Documento</th>
                <th>Endereco</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{item.phone || '-'}</td>
                  <td>{item.document || '-'}</td>
                  <td>{item.address || '-'}</td>
                  <td>
                    <button type="button" className="row-button" onClick={() => edit(item)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty title="Sua base está vazia" text="Cadastre o primeiro cliente para começar." />
        )}
      </DataCard>
    </ModuleLayout>
  )
}
function EmployeeModule({ data, form, update, submit, edit, remove, reset, saving }) {
  return (
    <ModuleLayout
      form={
        <Form
          title="funcionario"
          eyebrow="EQUIPE"
          submit={submit}
          saving={saving}
          editing={form.id}
          reset={reset}
        >
          <Field
            label="Nome completo"
            value={form.name}
            onChange={(v) => update('name', v)}
            required
          />
          <Field label="Telefone" value={form.phone} onChange={(v) => update('phone', v)} />
          <Field
            label="CPF ou CNPJ"
            value={form.document}
            onChange={(v) => update('document', v)}
          />
          <Field label="Cargo" value={form.role} onChange={(v) => update('role', v)} />
        </Form>
      }
    >
      <DataCard title="Equipe ativa" count={data.length}>
        {data.length ? (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cargo</th>
                <th>Telefone</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{item.role || '-'}</td>
                  <td>{item.phone || '-'}</td>
                  <td>
                    <button type="button" className="row-button" onClick={() => edit(item)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="row-button danger"
                      onClick={() => remove(item.id)}
                    >
                      Desativar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty
            title="Nenhum funcionario ativo"
            text="Cadastre sua equipe para atribuir responsaveis."
          />
        )}
      </DataCard>
    </ModuleLayout>
  )
}
function VehicleModule({
  customers,
  data,
  form,
  update,
  onCustomer,
  submit,
  edit,
  remove,
  reset,
  saving
}) {
  return (
    <ModuleLayout
      form={
        <Form
          title="veiculo"
          eyebrow="FROTA"
          submit={submit}
          saving={saving}
          editing={form.id}
          reset={reset}
        >
          <Select
            label="Cliente proprietario"
            value={form.customerId}
            onChange={onCustomer}
            required
            options={customers.map((item) => [item.id, item.name])}
          />
          <div className="field-row">
            <Field
              label="Placa"
              value={form.licensePlate}
              onChange={(v) => update('licensePlate', v)}
              required
            />
            <Field label="Ano" value={form.year} onChange={(v) => update('year', v)} />
          </div>
          <div className="field-row">
            <Field label="Marca" value={form.brand} onChange={(v) => update('brand', v)} />
            <Field label="Modelo" value={form.model} onChange={(v) => update('model', v)} />
          </div>
          <Field label="Cor" value={form.color} onChange={(v) => update('color', v)} />
        </Form>
      }
    >
      <DataCard
        title={form.customerId ? 'Veiculos do cliente' : 'Selecione um cliente'}
        count={data.length}
      >
        {data.length ? (
          <table>
            <thead>
              <tr>
                <th>Placa</th>
                <th>Veiculo</th>
                <th>Ano</th>
                <th>Cor</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong className="plate">{item.license_plate}</strong>
                  </td>
                  <td>
                    {item.brand} {item.model}
                  </td>
                  <td>{item.year || '-'}</td>
                  <td>{item.color || '-'}</td>
                  <td>
                    <button type="button" className="row-button" onClick={() => edit(item)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="row-button danger"
                      onClick={() => remove(item.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty
            title="Nenhum veiculo para mostrar"
            text="Selecione um cliente ou cadastre um veiculo."
          />
        )}
      </DataCard>
    </ModuleLayout>
  )
}
function PartModule({ data, form, update, submit, edit, reset, saving }) {
  return (
    <ModuleLayout
      form={
        <Form
          title="peca"
          eyebrow="INVENTARIO"
          submit={submit}
          saving={saving}
          editing={form.id}
          reset={reset}
        >
          <Field
            label="Codigo interno"
            value={form.internalCode}
            onChange={(v) => update('internalCode', v)}
          />
          <Field
            label="Descricao"
            value={form.description}
            onChange={(v) => update('description', v)}
            required
          />
          <div className="field-row">
            <Field
              label="Estoque"
              type="number"
              value={form.stockQuantity}
              onChange={(v) => update('stockQuantity', v)}
            />
            <Field
              label="Preco de custo"
              type="number"
              value={form.costPrice}
              onChange={(v) => update('costPrice', v)}
            />
          </div>
          <Field
            label="Preco de venda"
            type="number"
            value={form.sellingPrice}
            onChange={(v) => update('sellingPrice', v)}
          />
        </Form>
      }
    >
      <DataCard title="Inventario" count={data.length}>
        {data.length ? (
          <table>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Descricao</th>
                <th>Estoque</th>
                <th>Venda</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>{item.internal_code || '-'}</td>
                  <td>
                    <strong>{item.description}</strong>
                  </td>
                  <td>
                    <span className={item.stock_quantity < 2 ? 'stock low' : 'stock'}>
                      {item.stock_quantity}
                    </span>
                  </td>
                  <td>R$ {Number(item.selling_price).toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      className="row-button"
                      onClick={() =>
                        edit({
                          id: item.id,
                          internalCode: item.internal_code || '',
                          description: item.description,
                          stockQuantity: String(item.stock_quantity),
                          costPrice: String(item.cost_price),
                          sellingPrice: String(item.selling_price)
                        })
                      }
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty title="Estoque vazio" text="Cadastre a primeira peca do inventario." />
        )}
      </DataCard>
    </ModuleLayout>
  )
}

function OrderModule({
  customers,
  employees,
  vehicles,
  orders,
  form,
  update,
  onCustomer,
  submit,
  select,
  selected,
  status,
  details,
  parts,
  partItem,
  setPartItem,
  laborItem,
  setLaborItem,
  addPart,
  addLabor,
  onAction
}) {
  return (
    <div className="orders-layout">
      <section className="card order-list">
        <CardTitle
          eyebrow="ACOMPANHAMENTO"
          title="Ordens de servico"
          action={`${orders.length} registros`}
        />
        <OrderTable orders={orders} onSelect={select} selectedId={selected} onStatus={status} />
      </section>
      <Form title="ordem de servico" eyebrow="NOVA OS" submit={submit} saving={false}>
        <Select
          label="Cliente"
          value={form.customerId}
          onChange={onCustomer}
          required
          options={customers.map((item) => [item.id, item.name])}
        />
        <Select
          label="Veiculo"
          value={form.vehicleId}
          onChange={(v) => update('vehicleId', v)}
          required
          options={vehicles.map((item) => [
            item.id,
            `${item.license_plate} - ${item.brand} ${item.model}`
          ])}
        />
        <Select
          label="Responsavel"
          value={form.employeeId}
          onChange={(v) => update('employeeId', v)}
          options={employees.map((item) => [item.id, item.name])}
        />
        <Field
          label="Quilometragem"
          type="number"
          value={form.mileage}
          onChange={(v) => update('mileage', v)}
        />
        <TextField
          label="Defeito relatado"
          value={form.reportedDefect}
          onChange={(v) => update('reportedDefect', v)}
          required
        />
        <TextField
          label="Observacoes"
          value={form.mechanicNotes}
          onChange={(v) => update('mechanicNotes', v)}
        />
      </Form>
      {selected && (
        <OrderDetails
          id={selected}
          details={details}
          parts={parts}
          partItem={partItem}
          setPartItem={setPartItem}
          laborItem={laborItem}
          setLaborItem={setLaborItem}
          addPart={addPart}
          addLabor={addLabor}
          order={orders.find((item) => item.id === selected)}
          onAction={onAction}
        />
      )}
    </div>
  )
}
function OrderTable({ orders, onSelect, selectedId, onStatus }) {
  return (
    <table>
      <thead>
        <tr>
          <th>OS</th>
          <th>Cliente</th>
          <th>Veiculo</th>
          <th>Status</th>
          <th>Responsavel</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {orders.map((item) => (
          <tr key={item.id} className={selectedId === item.id ? 'selected' : ''}>
            <td>
              <button type="button" className="table-link" onClick={() => onSelect?.(item.id)}>
                #{item.id}
              </button>
            </td>
            <td>
              <strong>{item.customer_name}</strong>
            </td>
            <td>{item.license_plate}</td>
            <td>
              <span className={`status status-${item.status.toLowerCase().replaceAll(' ', '-')}`}>
                {item.status}
              </span>
            </td>
            <td>{item.employee_name || 'Nao atribuido'}</td>
            <td>
              {onStatus && !['Completed', 'Canceled'].includes(item.status) && (
                <button
                  type="button"
                  className="row-button"
                  onClick={() => onStatus(item.id, 'Completed')}
                >
                  Concluir
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
function OrderDetails({
  id,
  details,
  parts,
  partItem,
  setPartItem,
  laborItem,
  setLaborItem,
  addPart,
  addLabor,
  order,
  onAction
}) {
  const partsTotal = details.parts.reduce(
    (total, item) => total + item.quantity * item.unit_price,
    0
  )
  const laborTotal = details.labor.reduce((total, item) => total + Number(item.labor_cost), 0)
  return (
    <section className="card order-details">
      <div className="order-identity">
        <div>
          <small>ORDEM DE SERVIÇO</small>
          <h2>OS #{id}</h2>
          <p>
            {order?.customer_name} · {order?.license_plate} · {order?.brand} {order?.model}
          </p>
        </div>
        <span className="status status-open">{order?.status || 'Aberta'}</span>
      </div>
      <div className="order-actions">
        <button type="button" className="outline" onClick={() => onAction('whatsapp')}>
          Enviar orçamento
        </button>
        <button type="button" className="outline" onClick={() => onAction('print')}>
          Imprimir OS
        </button>
        <button type="button" className="primary" onClick={() => onAction('finish')}>
          Finalizar e cobrar
        </button>
      </div>
      <div className="detail-forms">
        <form onSubmit={addPart}>
          <strong>Adicionar peca</strong>
          <Select
            label="Peca"
            value={partItem.partId}
            onChange={(v) => setPartItem({ ...partItem, partId: v })}
            options={parts.map((item) => [item.id, `${item.description} (${item.stock_quantity})`])}
          />
          <Field
            label="Quantidade"
            type="number"
            value={partItem.quantity}
            onChange={(v) => setPartItem({ ...partItem, quantity: v })}
          />
          <button className="outline" type="submit">
            Adicionar
          </button>
        </form>
        <form onSubmit={addLabor}>
          <strong>Adicionar mao de obra</strong>
          <Field
            label="Descricao"
            value={laborItem.description}
            onChange={(v) => setLaborItem({ ...laborItem, description: v })}
          />
          <Field
            label="Valor"
            type="number"
            value={laborItem.laborCost}
            onChange={(v) => setLaborItem({ ...laborItem, laborCost: v })}
          />
          <button className="outline" type="submit">
            Adicionar
          </button>
        </form>
      </div>
      <div className="order-total">
        <span>
          Mão de obra <strong>R$ {laborTotal.toFixed(2)}</strong>
        </span>
        <span>
          Peças <strong>R$ {partsTotal.toFixed(2)}</strong>
        </span>
        <b>
          Total <strong>R$ {(laborTotal + partsTotal).toFixed(2)}</strong>
        </b>
      </div>
      <div className="line-items">
        <div>
          <small>PECAS</small>
          {details.parts.map((item) => (
            <p key={item.id}>
              <span>
                {item.description} x {item.quantity}
              </span>
              <strong>R$ {(item.quantity * item.unit_price).toFixed(2)}</strong>
            </p>
          ))}
        </div>
        <div>
          <small>MAO DE OBRA</small>
          {details.labor.map((item) => (
            <p key={item.id}>
              <span>{item.description}</span>
              <strong>R$ {Number(item.labor_cost).toFixed(2)}</strong>
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
function ModuleLayout({ form, children }) {
  return (
    <div className="module-layout">
      <div>{form}</div>
      <div>{children}</div>
    </div>
  )
}
function Form({ title, eyebrow, submit, saving, editing, reset, children }) {
  return (
    <form className="card form-card" onSubmit={submit}>
      <CardTitle eyebrow={eyebrow} title={editing ? `Editar ${title}` : `Novo ${title}`} />
      {children}
      <div className="form-actions">
        <button className="primary" type="submit" disabled={saving}>
          {saving ? 'Salvando...' : editing ? 'Atualizar' : 'Cadastrar'}
        </button>
        {editing && (
          <button className="ghost" type="button" onClick={reset}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={({ target }) => onChange(target.value)}
        required={required}
      />
    </label>
  )
}
function TextField({ label, value, onChange, required = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        value={value}
        onChange={({ target }) => onChange(target.value)}
        required={required}
      />
    </label>
  )
}
function Select({ label, value, onChange, options, required = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={({ target }) => onChange(target.value)} required={required}>
        <option value="">Selecione</option>
        {options.map(([id, text]) => (
          <option key={id} value={id}>
            {text}
          </option>
        ))}
      </select>
    </label>
  )
}
function DataCard({ title, count, children }) {
  return (
    <section className="card table-card">
      <CardTitle eyebrow="REGISTROS" title={title} action={count} />
      {children}
    </section>
  )
}
function CardTitle({ eyebrow, title, action, onAction }) {
  return (
    <div className="card-title">
      <div>
        <small>{eyebrow}</small>
        <h2>{title}</h2>
      </div>
      {action && (
        <button type="button" className="card-action" onClick={onAction}>
          {action} {onAction && '→'}
        </button>
      )}
    </div>
  )
}
function Empty({ title, text }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  )
}

export default App
