import { useRef, useState } from 'react';
import { ContextMenu } from 'primereact/contextmenu';
import type { MenuItem } from 'primereact/menuitem';
import { RippleViewButton, RippleViewMultiSelect } from '@enterprise/react-core-controls';

const STATUS_OPTIONS = [
  { label: 'Open', value: 'open' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Cancelled', value: 'cancelled' },
];

interface Order {
  id: string;
  customer: string;
  status: string;
}

const ALL_ORDERS: Order[] = [
  { id: 'ORD-1001', customer: 'Acme Co', status: 'open' },
  { id: 'ORD-1002', customer: 'Globex', status: 'processing' },
  { id: 'ORD-1003', customer: 'Initech', status: 'shipped' },
];

export function App() {
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const [orderAction, setOrderAction] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const contextMenuRef = useRef<ContextMenu>(null);

  const visibleOrders = statusFilter.length
    ? ALL_ORDERS.filter((order) => statusFilter.includes(order.status))
    : ALL_ORDERS;

  const orderMenuItems: MenuItem[] = [
    {
      label: 'View Details',
      icon: 'pi pi-eye',
      command: () => {
        if (selectedOrderId) {
          setOrderAction(`Viewed details for ${selectedOrderId}`);
        }
      },
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      command: () => {
        if (selectedOrderId) {
          setOrderAction(`Deleted ${selectedOrderId}`);
        }
      },
    },
  ];

  const handleOrderContextMenu = (event: React.MouseEvent, orderId: string) => {
    setSelectedOrderId(orderId);
    contextMenuRef.current?.show(event);
  };

  return (
    <main className="app">
      <header className="app__header">
        <h1>Orders</h1>
      </header>

      <section className="app__filter" aria-labelledby="filter-heading">
        <h2 id="filter-heading">Filter</h2>
        <RippleViewMultiSelect label="Status" options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
      </section>

      <section className="app__list" aria-labelledby="orders-heading">
        <h2 id="orders-heading">Orders</h2>
        <ContextMenu model={orderMenuItems} ref={contextMenuRef} />
        <ul>
          {visibleOrders.map((order) => (
            <li
              key={order.id}
              aria-label={`Order ${order.id}`}
              onContextMenu={(event) => handleOrderContextMenu(event, order.id)}
            >
              {order.id} &mdash; {order.customer} &mdash; {order.status}
            </li>
          ))}
        </ul>
        <RippleViewButton label="Refresh" icon="pi pi-refresh" onClick={() => setRefreshCount((count) => count + 1)} />
        <p className="app__readout">Refreshed {refreshCount} time(s)</p>
        <p className="app__readout">{orderAction ?? 'No order action yet'}</p>
      </section>
    </main>
  );
}
