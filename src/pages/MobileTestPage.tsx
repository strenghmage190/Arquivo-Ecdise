import React from 'react';
import InvestigationBoard from '../components/board/InvestigationBoard';

const MobileTestPage: React.FC = () => {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <InvestigationBoard investigationId="test-mobile" />
    </div>
  );
};

export default MobileTestPage;