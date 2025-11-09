import React, { createContext, useContext, useState } from 'react';

const LayoutContext = createContext({
  title: 'Dashboard',
  subtitle: '',
  setTitle: () => {},
  setSubtitle: () => {},
});

export const LayoutProvider = ({ children }) => {
  const [title, setTitle] = useState('Dashboard');
  const [subtitle, setSubtitle] = useState('');

  return (
    <LayoutContext.Provider value={{ title, subtitle, setTitle, setSubtitle }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => useContext(LayoutContext);

export default LayoutContext;
