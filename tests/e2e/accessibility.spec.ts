import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function mockApi(page: import('@playwright/test').Page) {
  await page.route('**/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const user={id:'u1',fullName:'Ada Example',email:'ada@example.com',phone:'+2348000000000',emailVerified:true,phoneVerified:true,onboardingStatus:'COMPLETE'};
    let data:unknown={};
    if(path.endsWith('/auth/refresh-token'))data={accessToken:'test-access'};
    else if(path.endsWith('/auth/me'))data=user;
    else if(path==='/v1/orders')data=[];
    else if(path==='/v1/wallet')data={id:'w1',currency:'NGN',availableBalance:'0',ledgerBalance:'0',status:'ACTIVE',hasNin:false,maskedNin:null,fundingAccount:null};
    else if(path.includes('/wallet/transactions'))data={items:[],nextCursor:null};
    else if(path.includes('/wallet/beneficiaries')||path.includes('/wallet/banks')||path.endsWith('/delivery-links/categories')||path==='/v1/delivery-links'||path.includes('/drafts/list'))data=[];
    else if(path.includes('/settlement/summary'))data={status:'READY',balance:{currency:'NGN',minorUnits:0},entries:[]};
    else if(path.endsWith('/account/profile'))data={...user,dob:'1990-01-01T00:00:00.000Z',gender:'FEMALE',accountNumber:'1234567890',hasNin:false,maskedNin:null};
    else if(path.includes('/delivery-links/public/'))data={token:'00000000-0000-0000-0000-000000000000',pickupSource:'customer',paymentBy:'vendor',business:{name:'Test shop',category:'Retail'}};
    await route.fulfill({json:{data,requestId:'00000000-0000-0000-0000-000000000000'}});
  });
}
for (const path of ['/auth/login', '/auth/sign-up', '/auth/forgot-password']) {
  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    expect(results.violations.filter((item) => ['critical','serious'].includes(item.impact ?? ''))).toEqual([]);
  });
}
for (const path of ['/app','/app/orders','/app/wallet','/app/business','/app/delivery-links','/app/settings','/app/settings/personal','/app/settings/payment','/app/settings/faq','/delivery/00000000-0000-0000-0000-000000000000']) {
  test(`${path} authenticated/public surface has no serious accessibility violations`, async ({page}) => {
    await mockApi(page); await page.goto(path); await expect(page.locator('main')).toBeVisible();
    const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    expect(results.violations.filter((item)=>['critical','serious'].includes(item.impact??''))).toEqual([]);
  });
}
test('keyboard focus is visible on login', async ({ page }) => { await page.goto('/auth/login'); await page.keyboard.press('Tab'); await expect(page.locator(':focus')).toBeVisible(); });
