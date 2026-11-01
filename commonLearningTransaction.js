// Suppress intermediate native saves while shared learning and stock are staged together.
// Real session deadlines keep advancing; the game catches up after the brief transaction.
export let commonTransactionOpen = false;
export function setCommonTransaction(open) { commonTransactionOpen = open; }
