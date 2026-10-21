import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { useContext, useMemo, type ReactNode } from 'react';
import { renderNodes, withSlots, withAssetUrl } from './Markdown.tsx';
import { AssetUrlContext } from './assets.ts';

const proc = unified().use(remarkParse).use(remarkGfm).use(remarkMath);

/** Render a Markdown string from a widget body (inline or block). */
export function Md({ src, block = false, slots }: { src: string | undefined; block?: boolean; slots?: ReactNode[] }): ReactNode {
  const assetUrl = useContext(AssetUrlContext);
  const tree = useMemo(() => (src ? proc.parse(src) : null), [src]);
  if (!tree) return null;
  if (block) return <>{withAssetUrl(assetUrl, () => withSlots(slots ?? null, () => renderNodes(tree.children as any, null)))}</>;
  // Inline: unwrap the single paragraph.
  const kids = tree.children.length === 1 && tree.children[0].type === 'paragraph' ? (tree.children[0] as any).children : tree.children;
  return <>{withAssetUrl(assetUrl, () => withSlots(slots ?? null, () => renderNodes(kids, null)))}</>;
}
