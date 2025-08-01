import React, { useEffect, useState } from 'react';
import Header from '../../../components/header';

function Category() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('https://localhost:3000/api/category');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error(err);
        setError('Unable to load categories.');
      }
    }
    fetchCategories();
  }, []);

  const fetchSubcategories = async (categoryName) => {
    setSelectedCategory(categoryName);
    setSubcategories([]);
    setProducts([]);
    setError('');
    try {
      const response = await fetch('https://localhost:3000/api/subcategory');
      if (!response.ok) throw new Error('Failed to fetch subcategories');
      const data = await response.json();
      const filteredSubcategories = data.filter(
        (subcategory) => subcategory.categoryId.category_name === categoryName
      );
      setSubcategories(filteredSubcategories);
    } catch (err) {
      console.error(err);
      setError('Unable to load subcategories.');
    }
  };

  const fetchProducts = async (subcategoryName) => {
    setSelectedSubcategory(subcategoryName);
    setProducts([]);
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `https://localhost:3000/api/item?subcategoryName=${encodeURIComponent(
          subcategoryName
        )}`
      );
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex bg-gray-50 pt-16">
      <Header />

      {/* Sidebar */}
      <div className="w-1/4 bg-white shadow-md p-4 mt-16">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Categories</h2>
        {categories.map((category) => (
          <div key={category._id} className="mb-2">
            <button
              className={`w-full text-left py-2 px-4 rounded ${selectedCategory === category.category_name
                  ? 'bg-sky-100 text-sky-600 font-semibold'
                  : 'hover:bg-gray-100 text-gray-700'
                }`}
              onClick={() => fetchSubcategories(category.category_name)}
            >
              {category.category_name}
            </button>
            {selectedCategory === category.category_name && (
              <div className="ml-4 mt-2">
                {subcategories.map((subcategory) => (
                  <button
                    key={subcategory._id}
                    className={`w-full text-left py-2 px-3 rounded ${selectedSubcategory === subcategory.subcategory_name
                        ? 'text-sky-600 font-semibold'
                        : 'hover:bg-gray-50 text-gray-600'
                      }`}
                    onClick={() => fetchProducts(subcategory.subcategory_name)}
                  >
                    {subcategory.subcategory_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right Content */}
      <div className="w-3/4 p-6 mt-16">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          {selectedSubcategory
            ? `Products in ${selectedSubcategory}`
            : 'Please select a category and subcategory'}
        </h2>
        {loading ? (
          <p className="text-gray-600">Loading products...</p>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition"
              >
                <img
                  src={`https://localhost:3000/item_images/${product.image}`}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {product.description}
                  </p>
                  <p className="text-lg font-bold text-sky-600">
                    Rs. {product.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            No products found. Please select a category and subcategory.
          </p>
        )}
      </div>
    </div>
  );
}

export default Category;
