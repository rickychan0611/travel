import { getAdminUser } from "@/lib/admin/auth";
import { getLandingPageContent } from "@/lib/admin/homepage-admin";
import {
  HEADER_LOGO_DISPLAY_SIZE,
  HEADER_LOGO_RECOMMENDED_SIZE,
  HOMEPAGE_METAOBJECT_TYPES,
  HOTLINE_LINE_MAX_LENGTH,
} from "@/lib/homepage/types";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { AdminPageHeader, AdminPanel } from "@/components/admin/AdminCards";
import { AdminOrderControls } from "@/components/admin/AdminOrderControls";
import { AdminPanelCloseButton } from "@/components/admin/AdminPanelCloseButton";
import { ShopifyImageField } from "@/components/admin/ShopifyImageField";
import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  initializeLandingPageAction,
  reorderLandingItemAction,
  saveLandingBrandingAction,
  saveLandingItemAction,
} from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950";
const panelFormClass =
  "space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3";
const submitClass =
  "rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60";

function Titles({
  titles = {},
  label = "Title",
}: {
  titles?: Record<string, string>;
  label?: string;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <TextField
        label={`${label} (English)`}
        name="titleEn"
        defaultValue={titles.en}
      />
      <TextField
        label={`${label} (简体中文)`}
        name="titleZhCn"
        defaultValue={titles["zh-CN"]}
      />
      <TextField
        label={`${label} (繁體中文)`}
        name="titleZhTw"
        defaultValue={titles["zh-TW"]}
      />
    </div>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        maxLength={maxLength}
        defaultValue={defaultValue}
        className={inputClass}
      />
    </label>
  );
}

function Context({
  type,
  id,
  parentId,
}: {
  type: string;
  id?: string;
  parentId?: string;
}) {
  return (
    <>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="id" value={id || ""} />
      {parentId ? (
        <input type="hidden" name="parentId" value={parentId} />
      ) : null}
    </>
  );
}

function ProductPreview({
  products,
  unavailable,
  locale,
}: {
  products: Array<{
    id: string;
    handle: string;
    title: string;
    productCode?: { value: string } | null;
    images: { nodes: Array<{ url: string }> };
  }>;
  unavailable: string[];
  locale: string;
}) {
  return (
    <div className="space-y-1 text-xs">
      {products.map((product) => (
        <div
          key={product.id}
          className="flex items-center gap-2 text-slate-600"
        >
          <span className="size-2 rounded-full bg-emerald-500" />
          <span className="font-mono">
            {product.productCode?.value || "No code"}
          </span>
          <a
            href={`/${locale}/tours/${product.handle}`}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-slate-300 underline-offset-2 hover:text-slate-950"
          >
            · {product.title}
          </a>
        </div>
      ))}
      {unavailable.map((id) => (
        <div key={id} className="text-amber-700">
          Unavailable or unpublished: {id}
        </div>
      ))}
    </div>
  );
}

function BrandingPanel({
  headerLogo,
  hotlineLinesByLocale,
  labels,
}: {
  headerLogo: Awaited<ReturnType<typeof getLandingPageContent>>["headerLogo"];
  hotlineLinesByLocale: Awaited<ReturnType<typeof getLandingPageContent>>["hotlineLinesByLocale"];
  labels: { title: string; save: string; hotline: string; saving: string };
}) {
  return (
    <AdminPanel
      title={labels.title}
      description={`Header logo · display ${HEADER_LOGO_DISPLAY_SIZE.width} × ${HEADER_LOGO_DISPLAY_SIZE.height}px (desktop). Upload ${HEADER_LOGO_RECOMMENDED_SIZE} (2×) PNG or WebP with a transparent background for best results.`}
      collapsible
      defaultOpen
    >
      <AdminActionForm
        action={saveLandingBrandingAction}
        submitLabel={labels.save}
        pendingLabel={labels.saving}
        className={panelFormClass}
        footerClassName="flex flex-wrap items-center gap-3"
        submitClassName={submitClass}
      >
        <ShopifyImageField
          label="Header logo"
          recommendedSize={HEADER_LOGO_RECOMMENDED_SIZE}
          initialImage={headerLogo}
          fit="contain"
        />
        <p className="text-xs leading-5 text-slate-500">
          Shown at {HEADER_LOGO_DISPLAY_SIZE.width} ×{" "}
          {HEADER_LOGO_DISPLAY_SIZE.height}px in the desktop header and scaled
          down in the mobile menu. Leave empty and save to restore the default
          logo.
        </p>
        <div className="border-t border-slate-200 pt-3">
          <div className="mb-2 text-sm font-medium text-slate-900">{labels.hotline}</div>
          <div className="space-y-3">
            {hotlineLinesByLocale.en.map((_, index) => (
              <div key={index} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Line {index + 1}</div>
                <div className="grid gap-3 md:grid-cols-3">
                  <TextField label={`English (maximum ${HOTLINE_LINE_MAX_LENGTH})`} name={`hotlineLine${index + 1}En`} defaultValue={hotlineLinesByLocale.en[index]} maxLength={HOTLINE_LINE_MAX_LENGTH} />
                  <TextField label={`简体中文 (maximum ${HOTLINE_LINE_MAX_LENGTH})`} name={`hotlineLine${index + 1}ZhCn`} defaultValue={hotlineLinesByLocale['zh-CN'][index]} maxLength={HOTLINE_LINE_MAX_LENGTH} />
                  <TextField label={`繁體中文 (maximum ${HOTLINE_LINE_MAX_LENGTH})`} name={`hotlineLine${index + 1}ZhTw`} defaultValue={hotlineLinesByLocale['zh-TW'][index]} maxLength={HOTLINE_LINE_MAX_LENGTH} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminActionForm>
    </AdminPanel>
  );
}

export default async function LandingPageAdmin({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  const brandingLabels = { title: t("siteBranding"), save: t("saveBranding"), hotline: t("hotlineLines"), saving: t("saving") };
  const [user, content] = await Promise.all([
    getAdminUser(),
    getLandingPageContent(locale, false),
  ]);

  if (!content.initialized) {
    return (
      <>
        <AdminPageHeader
          title={t("landingTitle")}
          description={t("landingDesc")}
        />
        <div className="space-y-4">
          <BrandingPanel headerLogo={content.headerLogo} hotlineLinesByLocale={content.hotlineLinesByLocale} labels={brandingLabels} />
          <AdminPanel
            title={t("setupBackend")}
            description={t("setupBackendDesc")}
          >
            {user?.isOwner ? (
              <AdminActionForm
                action={initializeLandingPageAction}
                submitLabel={t("setupImport")}
                pendingLabel="Setting up and importing…"
                footerClassName="flex flex-wrap items-center gap-3"
              >
                <p className="mb-4 max-w-3xl text-sm leading-6 text-slate-600">
                  This creates the homepage metaobject definitions, uploads the
                  current managed images to Shopify Files, imports the current
                  menu and seasonal content, and freezes the current six product
                  choices per tour tab.
                </p>
              </AdminActionForm>
            ) : (
              <p className="text-sm text-slate-600">
                An owner must initialize the landing page before staff can edit
                it.
              </p>
            )}
          </AdminPanel>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title={t("landingTitle")}
        description={t("landingPublishedDesc")}
      />
      <div className="space-y-4">
        <BrandingPanel headerLogo={content.headerLogo} hotlineLinesByLocale={content.hotlineLinesByLocale} labels={brandingLabels} />

        <AdminPanel
          title={t("heroBanners")}
          description="Autoplay slideshow. A linked banner searches with its visible translated title."
          collapsible
        >
          <div className="space-y-3">
            {content.heroSlides.map((slide, slideIndex) => (
              <div key={slide.id} className={panelFormClass}>
                <AdminOrderControls
                  action={reorderLandingItemAction}
                  type={HOMEPAGE_METAOBJECT_TYPES.hero}
                  id={slide.id}
                  position={slideIndex + 1}
                  total={content.heroSlides.length}
                />
                <AdminActionForm
                  action={saveLandingItemAction}
                  submitLabel={`${t("save")} ${t("heroBanners")}`}
                  deleteLabel={`${t("delete")} ${t("heroBanners")}`}
                  deleteConfirmMessage="Delete this banner?"
                  className="space-y-3"
                  footerClassName="flex flex-wrap items-center gap-3"
                  submitClassName={submitClass}
                >
                  <Context
                    type={HOMEPAGE_METAOBJECT_TYPES.hero}
                    id={slide.id}
                  />
                  <Titles titles={slide.titles} />
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input name="linkEnabled" type="checkbox" defaultChecked={slide.linkEnabled} className="size-4" />
                    Link banner using its translated title as the search keyword
                  </label>
                  <ShopifyImageField
                    label="Banner image"
                    recommendedSize="3840 × 780 px"
                    initialImage={slide.image}
                  />
                </AdminActionForm>
              </div>
            ))}
            <AdminActionForm
              action={saveLandingItemAction}
              submitLabel={`${t("add")} ${t("heroBanners")}`}
              pendingLabel={t("adding")}
              className="space-y-3 rounded-lg border border-dashed border-slate-300 p-3"
              footerClassName="flex flex-wrap items-center gap-3"
              submitClassName={submitClass}
            >
              <Context type={HOMEPAGE_METAOBJECT_TYPES.hero} />
              <Titles />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input name="linkEnabled" type="checkbox" defaultChecked className="size-4" />
                Link banner using its translated title as the search keyword
              </label>
              <ShopifyImageField
                label="Banner image"
                recommendedSize="3840 × 780 px"
              />
              <p className="text-xs text-slate-500">
                New banners are added last. Use Move up after adding to change
                the order.
              </p>
            </AdminActionForm>
          </div>
        </AdminPanel>

        <AdminPanel
          title={t("hotDestinationMenu")}
          description="Four fixed groups with editable destination links. Each visible title becomes its search keyword."
          collapsible
        >
          <div className="space-y-4">
            {content.destinationGroups.map((group, groupIndex) => (
              <details
                key={group.id}
                className="group/destination rounded-lg border border-slate-200 bg-slate-50"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="font-semibold text-slate-900">
                    Group {groupIndex + 1}: {group.title}
                  </span>
                  <span
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-500 transition group-open/destination:rotate-180"
                    aria-hidden="true"
                  >
                    <ChevronDown className="size-4" />
                  </span>
                </summary>
                <div className="border-t border-slate-200 p-3">
                  <AdminOrderControls
                    action={reorderLandingItemAction}
                    type={HOMEPAGE_METAOBJECT_TYPES.destinationGroup}
                    id={group.id}
                    position={groupIndex + 1}
                    total={content.destinationGroups.length}
                  />
                  <AdminActionForm
                    action={saveLandingItemAction}
                    submitLabel={t("save")}
                    className="space-y-3"
                    footerClassName="flex flex-wrap items-center gap-3"
                    submitClassName={submitClass}
                  >
                    <Context
                      type={HOMEPAGE_METAOBJECT_TYPES.destinationGroup}
                      id={group.id}
                    />
                    <Titles titles={group.titles} label="Group title" />
                  </AdminActionForm>
                  <div className="ml-4 mt-4 space-y-2 border-l-2 border-slate-200 pl-4 sm:ml-8 sm:pl-6">
                    {group.links.map((link, linkIndex) => (
                      <div
                        key={link.id}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <AdminOrderControls
                          action={reorderLandingItemAction}
                          type={HOMEPAGE_METAOBJECT_TYPES.destinationLink}
                          id={link.id}
                          parentId={group.id}
                          position={linkIndex + 1}
                          total={group.links.length}
                        />
                        <AdminActionForm
                          action={saveLandingItemAction}
                          submitLabel={t("save")}
                          deleteLabel={t("delete")}
                          deleteConfirmMessage="Delete this destination link?"
                          className="space-y-3"
                          footerClassName="flex flex-wrap items-center gap-3"
                          submitClassName={submitClass}
                        >
                          <Context
                            type={HOMEPAGE_METAOBJECT_TYPES.destinationLink}
                            id={link.id}
                            parentId={group.id}
                          />
                          <Titles titles={link.titles} label="Link title" />
                        </AdminActionForm>
                      </div>
                    ))}
                    <AdminActionForm
                      action={saveLandingItemAction}
                      submitLabel={t("add")}
                      pendingLabel={t("adding")}
                      className="space-y-3 rounded-lg border border-dashed border-slate-300 bg-white p-3"
                      footerClassName="flex flex-wrap items-center gap-3"
                      submitClassName={submitClass}
                    >
                      <Context
                        type={HOMEPAGE_METAOBJECT_TYPES.destinationLink}
                        parentId={group.id}
                      />
                      <Titles label="Link title" />
                      <p className="text-xs text-slate-500">
                        New links are added last. Use Move up after adding to
                        change the order.
                      </p>
                    </AdminActionForm>
                  </div>
                  <div className="mt-4 flex justify-end border-t border-slate-200 pt-3">
                    <AdminPanelCloseButton title={`${group.title} group`} />
                  </div>
                </div>
              </details>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel
          title={t("seasonalItems")}
          description="Seasonal linked image cards."
          collapsible
        >
          <div className="space-y-3">
            {content.seasonItems.map((item, itemIndex) => (
              <div key={item.id} className={panelFormClass}>
                <AdminOrderControls
                  action={reorderLandingItemAction}
                  type={HOMEPAGE_METAOBJECT_TYPES.season}
                  id={item.id}
                  position={itemIndex + 1}
                  total={content.seasonItems.length}
                />
                <AdminActionForm
                  action={saveLandingItemAction}
                  submitLabel={t("save")}
                  deleteLabel={t("delete")}
                  deleteConfirmMessage="Delete this seasonal item?"
                  className="space-y-3"
                  footerClassName="flex flex-wrap items-center gap-3"
                  submitClassName={submitClass}
                >
                  <Context
                    type={HOMEPAGE_METAOBJECT_TYPES.season}
                    id={item.id}
                  />
                  <Titles titles={item.titles} />
                  <ShopifyImageField
                    label="Seasonal image"
                    recommendedSize="660 × 600 px"
                    initialImage={item.image}
                  />
                </AdminActionForm>
              </div>
            ))}
            <AdminActionForm
              action={saveLandingItemAction}
              submitLabel={t("add")}
              pendingLabel={t("adding")}
              className="space-y-3 rounded-lg border border-dashed border-slate-300 p-3"
              footerClassName="flex flex-wrap items-center gap-3"
              submitClassName={submitClass}
            >
              <Context type={HOMEPAGE_METAOBJECT_TYPES.season} />
              <Titles />
              <ShopifyImageField
                label="Seasonal image"
                recommendedSize="660 × 600 px"
              />
              <p className="text-xs text-slate-500">
                New items are added last. Use Move up after adding to change the
                order.
              </p>
            </AdminActionForm>
          </div>
        </AdminPanel>

        <AdminPanel
          title={t("tourCollections")}
          description="Repeatable sections, category tabs, and up to six ordered product codes per tab."
          collapsible
        >
          <div className="space-y-4">
            {content.tourSections.map((section, sectionIndex) => (
              <details
                key={section.id}
                className="group/tour-section rounded-lg border border-slate-200 bg-slate-50"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 marker:hidden">
                  <span className="font-medium text-slate-900">
                    Section {sectionIndex + 1}: {section.title}
                  </span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open/tour-section:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="border-t border-slate-200 p-3">
                  <AdminOrderControls
                    action={reorderLandingItemAction}
                    type={HOMEPAGE_METAOBJECT_TYPES.tourSection}
                    id={section.id}
                    position={sectionIndex + 1}
                    total={content.tourSections.length}
                  />
                  <AdminActionForm
                    action={saveLandingItemAction}
                    submitLabel={t("save")}
                    deleteLabel={t("delete")}
                    deleteConfirmMessage="Delete this tour section and all of its categories?"
                    className="mt-3 space-y-3"
                    footerClassName="flex flex-wrap items-center gap-3"
                    submitClassName={submitClass}
                  >
                    <Context
                      type={HOMEPAGE_METAOBJECT_TYPES.tourSection}
                      id={section.id}
                    />
                    <Titles titles={section.titles} />
                  </AdminActionForm>
                  <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                    {section.categories.map((category, categoryIndex) => (
                      <details
                        key={category.id}
                        className="group/tour-category rounded-lg border border-slate-200 bg-white"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 marker:hidden">
                          <span className="font-medium text-slate-900">
                            Category {categoryIndex + 1}: {category.title}
                          </span>
                          <ChevronDown
                            className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open/tour-category:rotate-180"
                            aria-hidden="true"
                          />
                        </summary>
                        <div className="border-t border-slate-200 p-3">
                          <AdminOrderControls
                            action={reorderLandingItemAction}
                            type={HOMEPAGE_METAOBJECT_TYPES.tourCategory}
                            id={category.id}
                            parentId={section.id}
                            position={categoryIndex + 1}
                            total={section.categories.length}
                          />
                          <AdminActionForm
                            action={saveLandingItemAction}
                            submitLabel={t("save")}
                            deleteLabel={t("delete")}
                            deleteConfirmMessage="Delete this tour category?"
                            className="mt-3 space-y-3"
                            footerClassName="flex flex-wrap items-center gap-3"
                            submitClassName={submitClass}
                          >
                            <Context
                              type={HOMEPAGE_METAOBJECT_TYPES.tourCategory}
                              id={category.id}
                              parentId={section.id}
                            />
                            <Titles titles={category.titles} />
                            <label className="block">
                              <span className="text-sm text-slate-700">
                                Ordered product codes (maximum 6)
                              </span>
                              <textarea
                                name="productCodes"
                                defaultValue={category.productCodes.join("\n")}
                                rows={6}
                                placeholder={"P00008484\nP00008311"}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                              />
                              <span className="mt-1 block text-xs text-slate-500">
                                One code per line. Shopify product IDs are
                                resolved and stored automatically.
                              </span>
                            </label>
                            <ProductPreview
                              products={category.products}
                              unavailable={category.unavailableProductIds}
                              locale={locale}
                            />
                          </AdminActionForm>
                          <div className="mt-4 flex justify-end border-t border-slate-200 pt-3">
                            <AdminPanelCloseButton
                              title={`${category.title} category`}
                            />
                          </div>
                        </div>
                      </details>
                    ))}
                    <details className="rounded-lg border border-dashed border-slate-300 bg-white">
                      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-slate-800 marker:hidden">
                        Add tour category
                      </summary>
                      <AdminActionForm
                        action={saveLandingItemAction}
                        submitLabel={t("add")}
                        pendingLabel={t("adding")}
                        className="space-y-3 border-t border-slate-200 p-3"
                        footerClassName="flex flex-wrap items-center gap-3"
                        submitClassName={submitClass}
                      >
                        <Context
                          type={HOMEPAGE_METAOBJECT_TYPES.tourCategory}
                          parentId={section.id}
                        />
                        <Titles />
                        <label className="block">
                          <span className="text-sm text-slate-700">
                            Ordered product codes (maximum 6)
                          </span>
                          <textarea
                            name="productCodes"
                            rows={6}
                            placeholder={"P00008484\nP00008311"}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                          />
                          <span className="mt-1 block text-xs text-slate-500">
                            One code per line. Shopify product IDs are resolved
                            and stored automatically.
                          </span>
                        </label>
                        <p className="text-xs text-slate-500">
                          New categories are added last. Use Move up after
                          adding to change the order.
                        </p>
                      </AdminActionForm>
                    </details>
                  </div>
                  <div className="mt-4 flex justify-end border-t border-slate-200 pt-3">
                    <AdminPanelCloseButton title={section.title} />
                  </div>
                </div>
              </details>
            ))}
            <details className="rounded-lg border border-dashed border-slate-300">
              <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-slate-800 marker:hidden">
                Add tour section
              </summary>
              <AdminActionForm
                action={saveLandingItemAction}
                submitLabel={t("add")}
                pendingLabel={t("adding")}
                className="space-y-3 border-t border-slate-200 p-3"
                footerClassName="flex flex-wrap items-center gap-3"
                submitClassName={submitClass}
              >
                <Context type={HOMEPAGE_METAOBJECT_TYPES.tourSection} />
                <Titles />
                <p className="text-xs text-slate-500">
                  New sections are added last. Use Move up after adding to
                  change the order.
                </p>
              </AdminActionForm>
            </details>
          </div>
        </AdminPanel>
      </div>
    </>
  );
}
