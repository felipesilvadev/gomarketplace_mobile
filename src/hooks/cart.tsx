import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import { Alert } from 'react-native';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const response = await AsyncStorage.getItem('@GoMarketplace:products');

      if (response) {
        setProducts(JSON.parse(response));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function updateProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    }

    updateProducts();
  }, [products]);

  const addToCart = useCallback(
    async product => {
      try {
        const productIndex = products.findIndex(item => item.id === product.id);

        if (productIndex < 0) {
          setProducts(state => [
            ...state,
            {
              ...product,
              quantity: 1,
            },
          ]);
          return;
        }

        products[productIndex].quantity += 1;

        const updatedProducts = products.map(item => {
          if (item.id !== product.id) return item;

          return products[productIndex];
        });

        setProducts(updatedProducts);
      } catch (err) {
        console.log('Erro');
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(item => item.id === id);
      products[productIndex].quantity += 1;

      const listProductsUpdated = products.map(product => {
        if (product.id !== id) return product;

        return products[productIndex];
      });

      setProducts(listProductsUpdated);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);
      const { quantity } = products[productIndex];

      let listProductsUpdated;

      if (quantity === 1) {
        listProductsUpdated = products.filter(product => product.id !== id);

        setProducts(listProductsUpdated);
        return;
      }

      products[productIndex].quantity -= 1;

      listProductsUpdated = products.map(product => {
        if (product.id !== id) return product;

        return products[productIndex];
      });

      setProducts(listProductsUpdated);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
