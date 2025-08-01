import React from "react";
import { apiClient } from "../../../../services/apiServices";

const Actions = ({ productId, status, onUpdate }) => {
  const token = localStorage.getItem("token");

  const handleStatusUpdate = async (newStatus) => {
    try {
      const response = await apiClient.put(`/item/${productId}/status`, 
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(`Product status updated to ${newStatus}`);
      onUpdate(); // Trigger refresh of the product list
    } catch (error) {
      console.error("Error updating product status:", error);
      if (error.response?.status === 429) {
        alert("Rate limited - please try again in a moment.");
      } else {
        alert("Error updating product status. Please try again.");
      }
    }
  };

  return (
    <div>
      {status === "Pending" && (
        <div className="flex space-x-2">
          <button
            className="bg-green-500 text-white px-2 py-1 rounded"
            onClick={() => handleStatusUpdate("Approved")}
          >
            Approve
          </button>
          <button
            className="bg-red-500 text-white px-2 py-1 rounded"
            onClick={() => handleStatusUpdate("Rejected")}
          >
            Reject
          </button>
        </div>
      )}
      {status !== "Pending" && (
        <p className={`font-bold ${status === "Approved" ? "text-green-500" : "text-red-500"}`}>
          {status}
        </p>
      )}
    </div>
  );
};

export default Actions;
