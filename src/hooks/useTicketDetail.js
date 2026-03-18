import { useState } from 'react';

/**
 * useTicketDetail
 * Manages open/close state and selected ticket for TicketDetailModal.
 * Use this in any page/component that renders a clickable ticket row.
 *
 * Usage:
 *   const { selected, openTicket, closeTicket } = useTicketDetail();
 *
 *   // On row click:
 *   onClick={() => openTicket(ticket)}
 *
 *   // Pass to modal:
 *   <TicketDetailModal
 *     ticket={selected}
 *     isOpen={!!selected}
 *     onClose={closeTicket}
 *     ...
 *   />
 */
const useTicketDetail = () => {
  const [selected, setSelected] = useState(null);

  const openTicket  = (ticket) => setSelected(ticket);
  const closeTicket = ()       => setSelected(null);

  return { selected, openTicket, closeTicket };
};

export default useTicketDetail;
