export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  isAdmin: boolean;
  active: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Author {
  id: number;
  name: string;
  nationality?: string;
  birthDate?: string;
}

export interface Book {
  id: number;
  title: string;
  isbn: string;
  year?: number;
  totalCopies: number;
  availableCopies: number;
  categoryId: number;
  Category?: { id: number; name: string };
  Authors?: Author[];
}

export interface Reader {
  id: number;
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
}

export interface Loan {
  id: number;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'ATIVO' | 'ATRASADO' | 'DEVOLVIDO';
  fine: number;
  bookId: number;
  readerId: number;
  userId: number;
  Book?: { id: number; title: string; isbn: string; availableCopies: number };
  Reader?: { id: number; name: string; cpf: string; email?: string };
  User?: { id: number; name: string; email: string };
}

export interface DashboardStats {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  activeLoans: number;
  overdueLoans: number;
  totalFines: number;
}