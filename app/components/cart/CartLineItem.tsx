import type {
  CartLine,
  CartLineUpdateInput,
} from '@shopify/hydrogen/storefront-api-types';

import {Link} from '@remix-run/react';
import {
  CartForm,
  Image,
  Money,
  OptimisticInput,
  parseGid,
  useOptimisticData,
} from '@shopify/hydrogen';
import {m} from 'framer-motion';

import {useLocalePath} from '~/hooks/useLocalePath';

import {QuantitySelector} from '../QuantitySelector';
import {IconRemove} from '../icons/IconRemove';

type OptimisticData = {
  action?: string;
  quantity?: number;
};

const base = 4;
const t = (n: number) => base * n;

export function CartLineItem({
  line,
  onClose,
}: {
  line: CartLine;
  onClose?: () => void;
}) {
  const optimisticData = useOptimisticData<OptimisticData>(line?.id);
  const {id, merchandise, quantity} = line;
  const variantId = parseGid(merchandise?.id)?.id;
  const productPath = useLocalePath({
    path: `/products/${merchandise.product.handle}?variant=${variantId}`,
  });

  if (!line?.id) return null;
  if (typeof quantity === 'undefined' || !merchandise?.product) return null;

  const variants = {
    hidden: {
      height: 0,
      opacity: 0,
      transition: {
        bounce: 0,
        duration: t(0.15),
        opacity: {
          delay: t(0.03),
        },
        type: 'spring',
      },
    },
    visible: {
      height: 'auto',
      opacity: 1,
      transition: {
        bounce: 0.3,
        opacity: {
          delay: t(0.025),
        },
        type: 'spring',
      },
    },
  };

  // Animated list implmentation inspired by the fantastic Build UI recipes
  // (Check out the original at: https://buildui.com/recipes/animated-list)
  // Credit to the Build UI team for the awesome List animation.
  return (
    <m.li
      animate={
        // Hide the line item if the optimistic data action is remove
        // Do not remove the form from the DOM
        optimisticData?.action === 'remove' ? 'hidden' : 'visible'
      }
      className="overflow-hidden"
      initial="hidden"
      key={id}
      variants={variants}
    >
      <div className="flex gap-4 py-5">
        <div className="size-16">
          {merchandise.image && (
            <Image
              alt={merchandise.title}
              aspectRatio="1/1"
              className="h-auto w-full rounded border border-border object-cover object-center"
              data={merchandise.image}
              data-vaul-no-drag={true}
              draggable={false}
              loading="eager"
              sizes="64px"
            />
          )}
        </div>

        <div className="flex flex-grow justify-between">
          <div className="grid gap-2">
            <h3 className="text-2xl" data-vaul-no-drag={true}>
              {merchandise?.product?.handle ? (
                <Link
                  data-vaul-no-drag={true}
                  onClick={onClose}
                  to={productPath}
                >
                  {merchandise?.product?.title || ''}
                </Link>
              ) : (
                <p>{merchandise?.product?.title || ''}</p>
              )}
            </h3>
            {merchandise?.selectedOptions.find(
              (option) => option.value !== 'Default Title',
            ) && (
              <div className="grid pb-2">
                {(merchandise?.selectedOptions || []).map((option) => (
                  <span className="opacity-80" key={option.name}>
                    {option.name}: {option.value}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="flex justify-start">
                <CartLineQuantityAdjust line={line} />
              </div>
              <ItemRemoveButton lineId={id} />
            </div>
          </div>
          <span>
            <CartLinePrice as="span" line={line} />
          </span>
        </div>
      </div>
    </m.li>
  );
}

function ItemRemoveButton({lineId}: {lineId: CartLine['id']}) {
  const cartPath = useLocalePath({path: '/cart'});

  return (
    <CartForm
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{
        lineIds: [lineId],
      }}
      route={cartPath}
    >
      <button
        className="flex size-10 items-center justify-center overflow-hidden rounded border border-border hover:bg-muted"
        data-vaul-no-drag={true}
        type="submit"
      >
        {/* Todo => add theme content string */}
        <span className="sr-only">Remove</span>
        <IconRemove aria-hidden="true" />
      </button>
      <OptimisticInput data={{action: 'remove'}} id={lineId} />
    </CartForm>
  );
}

function CartLinePrice({
  line,
  priceType = 'regular',
  ...passthroughProps
}: {
  [key: string]: any;
  line: CartLine;
  priceType?: 'compareAt' | 'regular';
}) {
  if (!line?.cost?.amountPerQuantity || !line?.cost?.totalAmount) return null;

  const moneyV2 =
    priceType === 'regular'
      ? line.cost.totalAmount
      : line.cost.compareAtAmountPerQuantity;

  if (moneyV2 == null) {
    return null;
  }

  return <Money withoutTrailingZeros {...passthroughProps} data={moneyV2} />;
}

function UpdateCartForm({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  const cartPath = useLocalePath({path: '/cart'});

  return (
    <CartForm
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{
        lines,
      }}
      route={cartPath}
    >
      {children}
    </CartForm>
  );
}

function CartLineQuantityAdjust({line}: {line: CartLine}) {
  const optimisticId = line?.id;
  const optimisticData = useOptimisticData<OptimisticData>(optimisticId);

  if (!line || typeof line?.quantity === 'undefined') return null;

  const optimisticQuantity = optimisticData?.quantity || line.quantity;

  const {id: lineId} = line;
  const prevQuantity = Number(Math.max(0, optimisticQuantity - 1).toFixed(0));
  const nextQuantity = Number((optimisticQuantity + 1).toFixed(0));

  return (
    <>
      <label className="sr-only" htmlFor={`quantity-${lineId}`}>
        {/* Todo => add theme content string */}
        Quantity, {optimisticQuantity}
      </label>
      <QuantitySelector>
        <UpdateCartForm lines={[{id: lineId, quantity: prevQuantity}]}>
          <QuantitySelector.Button
            disabled={optimisticQuantity <= 1}
            value={prevQuantity}
            variant="decrease"
          >
            <OptimisticInput
              data={{quantity: prevQuantity}}
              id={optimisticId}
            />
          </QuantitySelector.Button>
        </UpdateCartForm>
        <QuantitySelector.Value>{optimisticQuantity}</QuantitySelector.Value>
        <UpdateCartForm lines={[{id: lineId, quantity: nextQuantity}]}>
          <QuantitySelector.Button value={nextQuantity} variant="increase">
            <OptimisticInput
              data={{quantity: nextQuantity}}
              id={optimisticId}
            />
          </QuantitySelector.Button>
        </UpdateCartForm>
      </QuantitySelector>
    </>
  );
}
