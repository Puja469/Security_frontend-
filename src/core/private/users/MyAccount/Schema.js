export const productValidationSchema = {
    name: { required: "Product name is required" },
    price: { required: "Price is required" },
    description: { required: "Description is required" },
    date: { required: "Date is required" },
    categoryId: { required: "Category is required" },
    subcategoryId: { required: "Subcategory is required" },
};
