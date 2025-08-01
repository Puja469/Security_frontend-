import React from "react";
import ProductTable from "./Table";
import { Outlet } from "react-router-dom";

const ProductManagement = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Product Management</h1>
      <ProductTable />
      <Outlet />
      
    </div>
  );
};

export default ProductManagement;
