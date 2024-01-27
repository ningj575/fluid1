import type {TypeFromSelection} from 'groqd';

import {Link} from '@remix-run/react';
import {vercelStegaCleanAll} from '@sanity/client/stega';

import type {INTERNAL_LINK_FRAGMENT} from '~/qroq/links';

import {Button} from '~/components/ui/Button';
import {useLocale} from '~/hooks/useLocale';
import {cn} from '~/lib/utils';

type SanityInternalLinkProps = TypeFromSelection<typeof INTERNAL_LINK_FRAGMENT>;

export function SanityInternalLink(props: {
  children?: React.ReactNode;
  className?: string;
  data?: SanityInternalLinkProps;
}) {
  const locale = useLocale();
  const {children, className, data} = props;

  if (!data) return null;

  const {link, name} = data;

  const documentType = link?.documentType;
  const slug = link?.slug?.current;
  const anchor = data.anchor ? `#${data.anchor}` : '';

  const path: () => string = () => {
    switch (documentType) {
      case 'page':
        return `${locale?.pathPrefix}/${slug}`;
      case 'product':
        return `${locale?.pathPrefix}/products/${slug}`;
      case 'collection':
        return `${locale?.pathPrefix}/collections/${slug}`;
      case 'home':
        return locale?.pathPrefix || '/';
      case 'blogPost':
        return `${locale?.pathPrefix}/blog/${slug}`;
      default:
        return '';
    }
  };

  // Remove encode stega data from url
  const url = vercelStegaCleanAll(`${path()}${anchor}`);

  // Todo: add Navlink support
  return (
    <Link
      className={cn([
        'focus-visible:ring-ring focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        className,
      ])}
      prefetch="intent"
      to={url}
    >
      {children ? children : name}
    </Link>
  );
}
