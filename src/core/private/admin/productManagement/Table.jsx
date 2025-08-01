import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Actions from "./Actions";
import { apiClient } from "../../../../services/apiServices";

const ITEMS_PER_PAGE = 5; 
const ProductTable = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const token = localStorage.getItem("token");

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await apiClient.get("/item", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
        if (error.response?.status === 429) {
          console.warn("Rate limited - products request");
        }
      }
    }
    loadProducts();
  }, [token]);

  const refreshProducts = async () => {
    try {
      const response = await apiClient.get("/item", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProducts(response.data);
    } catch (error) {
      console.error("Error refreshing products:", error);
      if (error.response?.status === 429) {
        console.warn("Rate limited - refresh products request");
      }
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const selectedProducts = products.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 shadow-lg rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 border-b text-left">ID</th>
              <th className="py-3 px-4 border-b text-left">Name</th>
              <th className="py-3 px-4 border-b text-left">Status</th>
              <th className="py-3 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {selectedProducts.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b">{product._id}</td>
                <td className="py-3 px-4 border-b">{product.name}</td>
                <td className="py-3 px-4 border-b">{product.status}</td>
                <td className="py-3 px-4 border-b flex space-x-2">
                  <button
                    className="text-blue-500 hover:underline"
                    onClick={() => navigate(`/admin/products/details/${product._id}`)}
                  >
                    View Details
                  </button>
                  <Actions
                    productId={product._id}
                    status={product.status}
                    onUpdate={refreshProducts}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center mt-4 space-x-4">
        <button
          className="px-4 py-2 border rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Previous
        </button>
        <span className="px-4 py-2">Page {currentPage} of {totalPages}</span>
        <button
          className="px-4 py-2 border rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ProductTable;
