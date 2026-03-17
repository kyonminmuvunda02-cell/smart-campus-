import { useAuth } from '../context/AuthContext';

export function useRole() {
  const { role } = useAuth();
  return {
    isStudent: role === 'Student',
    isLecturer: role === 'Lecturer',
    isAdmin: role === 'Admin',
    role,
  };
}
