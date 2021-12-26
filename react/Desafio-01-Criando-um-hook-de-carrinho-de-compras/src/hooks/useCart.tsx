import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}
interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart")

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const prevCartRef = useRef<Product[]>()

  useEffect(() => {
    prevCartRef.current = cart;
  })

  const cartPreviousValue = prevCartRef.current ?? cart;

  useEffect(() => {
    if(cartPreviousValue !== cart) {
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart))
    }
  }, [cart, cartPreviousValue])

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]
      const productExists = cart.find(product => product.id === productId)

      const stockResponse = await api.get(`stock/${productId}`)
      const stock = stockResponse.data;

      const stockAmount = stock.amount;
      const currentProductAmount = productExists ? productExists.amount : 0;
      const afterIncrementAmount = currentProductAmount + 1;

      if (afterIncrementAmount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {
        productExists.amount = afterIncrementAmount
      } else {
        const response = await api.get(`products/${productId}`)
        const product = response.data;

        const newProduct = {
          ...product,
          amount: afterIncrementAmount
        }
        updatedCart.push(newProduct)
      }

      setCart(updatedCart)
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId)

      if (productExists) {
        const cartWithoutRemovedProduct = cart.filter(product => product.id !== productId)

        setCart(cartWithoutRemovedProduct)
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const stock = await api.get(`stock/${productId}`)

      const stockAmount = stock.data.amount;

      if (amount >= stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);


      if (productExists) {
        productExists.amount = amount;
      } else {
        throw Error();
      }

      setCart(updatedCart)
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
