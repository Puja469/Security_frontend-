import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  FaCalendarAlt,
  FaCamera,
  FaEdit,
  FaExchangeAlt,
  FaFileAlt,
  FaImage,
  FaLightbulb,
  FaList,
  FaMagic,
  FaPlus,
  FaRocket,
  FaSave,
  FaShieldAlt,
  FaSpinner,
  FaStar,
  FaTag,
  FaTimes,
  FaUndo
} from "react-icons/fa";
import { toast } from "react-toastify";
import {
  addProduct,
  fetchCategories,
  fetchSubcategories
} from "../../../../services/apiServices";
import { productValidationSchema } from "./Schema";

const Form = ({ setShowAddProductModal, handleAddProduct, editProduct }) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      price: "",
      description: "",
      date: "",
      categoryId: "",
      subcategoryId: "",
      image: null,
      isRefundable: "",
      isExchangeable: "",
    },
  });

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const watchCategoryId = watch("categoryId");
  const watchImage = watch("image");

  // Set form values if editing
  useEffect(() => {
    if (editProduct) {
      setValue("name", editProduct.name || "");
      setValue("price", editProduct.price || "");
      setValue("description", editProduct.description || "");
      setValue("date", editProduct.date || "");
      setValue("categoryId", editProduct.categoryId || "");
      setValue("subcategoryId", editProduct.subcategoryId || "");
      setValue("isRefundable", editProduct.isRefundable?.toString() || "");
      setValue("isExchangeable", editProduct.isExchangeable?.toString() || "");

      if (editProduct.image) {
        setImagePreview(`https://localhost:3000/item_images/${editProduct.image}`);
      }
    }
  }, [editProduct, setValue]);

  // Handle image preview
  useEffect(() => {
    if (watchImage && watchImage[0]) {
      const file = watchImage[0];
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  }, [watchImage]);

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data))
      .catch((error) => toast.error(`Error fetching categories: ${error.message}`, { autoClose: 2000 }));
  }, []);

  useEffect(() => {
    if (watchCategoryId) {
      fetchSubcategories(watchCategoryId)
        .then((data) => setSubcategories(data))
        .catch((error) =>
          toast.error(`Error fetching subcategories: ${error.message}`, { autoClose: 2000 })
        );
    } else {
      setSubcategories([]);
    }
  }, [watchCategoryId]);

  const onSubmit = async (data) => {
    setIsLoading(true);

    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === "image" && data[key]) {
        formData.append("file", data[key][0]);
      } else {
        formData.append(key, data[key]);
      }
    });

    formData.append("sellerId", userId);
    formData.append("status", "Pending");

    try {
      const newProduct = await addProduct(token, formData);
      toast.success("Product added successfully!", { autoClose: 2000 });
      handleAddProduct(newProduct);
      setShowAddProductModal(false);
      reset();
      setImagePreview(null);
    } catch (error) {
      toast.error(`Error adding product: ${error.message}`, { autoClose: 2000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 rounded-t-3xl text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                {editProduct ? <FaEdit className="text-2xl" /> : <FaPlus className="text-2xl" />}
              </div>
              <div>
                <h2 className="text-3xl font-bold">
                  {editProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-amber-100 mt-1">
                  {editProduct ? "Update your product details" : "Create a new product listing"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddProductModal(false)}
              className="p-3 bg-white/20 rounded-2xl hover:bg-white/30 transition-all duration-300 transform hover:scale-110"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Product Image Upload */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-3xl border-4 border-amber-200 overflow-hidden mx-auto mb-4 shadow-xl">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Product Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <FaImage className="text-gray-400 text-4xl" />
                    </div>
                  )}
                </div>

                <label className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white cursor-pointer hover:from-amber-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-110 shadow-lg">
                  <FaCamera className="text-lg" />
                  <input
                    type="file"
                    accept="image/*"
                    {...register("image", productValidationSchema.image)}
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500">Click the camera icon to upload product image (Max 5MB)</p>
              {errors.image && <p className="text-red-500 text-sm mt-2">{errors.image.message}</p>}
            </div>

            {/* Product Name and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FaTag className="text-amber-500" />
                  Product Name
                </label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  {...register("name", productValidationSchema.name)}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FaTag className="text-amber-500" />
                  Price
                </label>
                <div className="flex items-center gap-2 p-4 border-2 border-gray-200 rounded-2xl focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-amber-500 transition-all duration-300 bg-white/50 backdrop-blur-sm">
                  <input
                    type="number"
                    placeholder="Enter price"
                    {...register("price", productValidationSchema.price)}
                    className="w-full outline-none bg-transparent"
                  />
                  <span className="text-amber-500 text-lg font-semibold">Rs</span>
                </div>
                {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FaFileAlt className="text-amber-500" />
                Description
              </label>
              <textarea
                placeholder="Describe your product in detail..."
                rows="4"
                {...register("description", productValidationSchema.description)}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 bg-white/50 backdrop-blur-sm resize-none"
              ></textarea>
              {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            </div>

            {/* Date and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FaCalendarAlt className="text-amber-500" />
                  Date
                </label>
                <input
                  type="date"
                  {...register("date", productValidationSchema.date)}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                />
                {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FaList className="text-amber-500" />
                  Category
                </label>
                <select
                  {...register("categoryId", productValidationSchema.categoryId)}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-red-500 text-sm">{errors.categoryId.message}</p>}
              </div>
            </div>

            {/* Subcategory and Refundable */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FaList className="text-amber-500" />
                  Subcategory
                </label>
                <select
                  {...register("subcategoryId", productValidationSchema.subcategoryId)}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
                  disabled={!watchCategoryId}
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory._id} value={subcategory._id}>
                      {subcategory.subcategory_name}
                    </option>
                  ))}
                </select>
                {errors.subcategoryId && <p className="text-red-500 text-sm">{errors.subcategoryId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FaUndo className="text-amber-500" />
                  Refundable
                </label>
                <select
                  {...register("isRefundable", {
                    required: "Please specify if the product is refundable",
                  })}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
                >
                  <option value="">Select Option</option>
                  <option value="true">✅ Yes</option>
                  <option value="false">❌ No</option>
                </select>
                {errors.isRefundable && <p className="text-red-500 text-sm">{errors.isRefundable.message}</p>}
              </div>
            </div>

            {/* Exchangeable */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FaExchangeAlt className="text-amber-500" />
                Exchangeable
              </label>
              <select
                {...register("isExchangeable", {
                  required: "Please specify if the product is exchangeable",
                })}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 bg-white/50 backdrop-blur-sm appearance-none"
              >
                <option value="">Select Option</option>
                <option value="true">✅ Yes</option>
                <option value="false">❌ No</option>
              </select>
              {errors.isExchangeable && <p className="text-red-500 text-sm">{errors.isExchangeable.message}</p>}
            </div>

            {/* Tips Section */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
              <div className="flex items-center gap-3 mb-4">
                <FaLightbulb className="text-amber-600 text-xl" />
                <h4 className="font-semibold text-amber-800">Product Tips</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-700">
                <div className="flex items-center gap-2">
                  <FaStar className="text-amber-500" />
                  <span>Use clear, high-quality images</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaShieldAlt className="text-amber-500" />
                  <span>Provide detailed descriptions</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaRocket className="text-amber-500" />
                  <span>Set competitive pricing</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaMagic className="text-amber-500" />
                  <span>Choose appropriate categories</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="flex-1 p-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="flex-1 p-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isLoading || isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    {editProduct ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <FaSave />
                    {editProduct ? "Update Product" : "Add Product"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Form;
