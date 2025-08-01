import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../../../../services/apiServices";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [category, setCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    async function loadProductDetail() {
      try {
        const response = await apiClient.get(`/item/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProduct(response.data);

        if (response.data.userId) {
          try {
            const sellerResponse = await apiClient.get(`/user/${response.data.userId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            setSeller(sellerResponse.data.fname);
          } catch (error) {
            console.error("Error fetching seller:", error);
          }
        }

        if (response.data.categoryId) {
          try {
            const categoryResponse = await apiClient.get(`/category/${response.data.categoryId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            setCategory(categoryResponse.data.category_name);
          } catch (error) {
            console.error("Error fetching category:", error);
          }
        }

        if (response.data.subcategoryId) {
          try {
            const subcategoryResponse = await apiClient.get(`/subcategory/${response.data.subcategoryId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            setSubcategory(subcategoryResponse.data.subcategory_name);
          } catch (error) {
            console.error("Error fetching subcategory:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      }
    }
    loadProductDetail();
  }, [id, token]);

  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Image */}
        <div>
          <img
            src={`https://localhost:3000/item_images/${product.image}`}
            alt={product.name}
            className="w-full h-80 object-cover rounded-lg"
          />
        </div>

        {/* Product Details */}
        <div>
          <p className="text-gray-600 mb-2">
            <span className="font-bold">Description:</span> {product.description}
          </p>
          <p className="text-gray-600 mb-2">
            <span className="font-bold">Price:</span> Rs {product.price}
          </p>
          <p className="text-gray-600 mb-2">
            <span className="font-bold">Refundable:</span> {product.isRefundable}
          </p>
          <p className="text-gray-600 mb-2">
            <span className="font-bold">Exchangeable:</span> {product.isExchangeable}
          </p>
          <p className="text-gray-600 mb-2">
            <span className="font-bold">Category:</span> {category || "N/A"}
          </p>
          <p className="text-gray-600 mb-2">
            <span className="font-bold">Subcategory:</span> {subcategory || "N/A"}
          </p>
          <p className="text-gray-600 mb-2">
            <span className="font-bold">Seller:</span> {seller || "N/A"}
          </p>
          <p className="text-gray-600">
            <span className="font-bold">Purchase Date:</span>{" "}
            {new Date(product.date).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
