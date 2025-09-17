import React from 'react';
import { ClientManagement } from '../ClientManagement';

interface ClientsManagementProps {
  isDark: boolean;
  baseClasses: {
    background: string;
    sidebar: string;
    card: string;
    border: string;
    text: string;
    input: string;
    accent: string;
    yellow: string;
  };
}

export const ClientsManagement: React.FC<ClientsManagementProps> = ({ isDark, baseClasses }) => {
  return <ClientManagement />;
};

export default ClientsManagement;