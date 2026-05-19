import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'kh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    'nav.home': 'Home',
    'nav.explore': 'Explore Products',
    'nav.deliveries': 'My Deliveries',
    'nav.profile': 'View Profile Settings',
    'nav.signin': 'Sign In',
    'nav.signout': 'Sign Out Session',
    'nav.portal': 'Quick Testing Portal',
    
    // Home Hero & Section Headers
    'home.badge': 'Voted #1 Multi-Vendor Logistic Platform',
    'home.hero_title': 'Premium Shopping.',
    'home.hero_subtitle': 'Real-Time Tracking.',
    'home.hero_desc': 'Experience our next-generation catalog curated from regional top-vendors. Pay instantly using local ABA KHQR and watch our riders navigate routes on high-fidelity live maps.',
    'home.search_ph': 'Search premium headphones, trench coats, berries...',
    'home.search': 'Search',
    'home.trending_searches': 'Trending searches:',
    'home.categories_title': 'Explore Top Categories',
    'home.categories_subtitle': 'Pick a category bubble to filter the product marketplace',
    'home.all_products': 'All Products',
    'home.picks_title': 'Trending Premium Picks',
    'home.picks_subtitle': 'Hand-selected items from our verified vendor merchants',
    'home.updated_hourly': 'Updated hourly',
    
    // Cards
    'home.rewards_title': 'Sleek Loyalty Rewards',
    'home.rewards_desc': 'Earn 5% flat cashback points on every online KHQR or PayPal purchase. Redeem points directly at checkout for full invoice deductions.',
    'home.affiliate_title': 'Affiliate Partnerships',
    'home.affiliate_desc': 'Share your customizable unique affiliate referral links. Gain 2% flat lifetime passive commissions on orders successfully completed by friends!',
    
    // UI Elements
    'ui.cart': 'Shopping Cart',
    'ui.add_cart': 'Add to Cart',
    'ui.checkout': 'Proceed To Checkout',
    'ui.subtotal': 'Subtotal',
    'ui.discount': 'Discount Amount',
    'ui.fee': 'Delivery Fee',
    'ui.total': 'Order Total',
    'ui.place_order': 'Authorize Secure Payment',
    
    // Categories
    'cat.all': 'All Listings',
    'cat.electronics': 'Electronics & Gadgets',
    'cat.apparel': 'Fashion & Apparel',
    'cat.groceries': 'Organic Groceries',
    
    // Status
    'status.pending': 'Pending Payment',
    'status.confirmed': 'Order Confirmed',
    'status.packing': 'Preparing & Packing',
    'status.shipping': 'Dispatched for Shipping',
    'status.out_for_delivery': 'Out for Delivery',
    'status.delivered': 'Successfully Delivered',
    'status.failed': 'Delivery Failed',
    
    // Tracking
    'tracking.title': 'Real-Time Logistics Tracker',
    'tracking.subtitle': 'Dynamic Cambodia GPS route plotting & SSE coordination',
    'tracking.eta': 'Estimated Arrival Time',
    'tracking.eta_unit': 'Minutes',
    'tracking.phone': 'Call Courier',
    
    // Address Form
    'form.receiver': 'Receiver Full Name',
    'form.phone': 'Contact Telephone',
    'form.note': 'Logistics Remark Notes',
    'form.autodetect': 'Auto Detect My Location',
    'form.remark_ph': 'e.g. Ring doorbell / drop at front desk...',

    // Vendor Dashboard
    'vendor.portal': 'Vendor Storefront Portal',
    'vendor.portal_desc': 'Monitor shop earnings, prepare customer orders, and build inventory',
    'vendor.store_revenue': 'Store Revenue',
    'vendor.revenue_sub': 'ABA / PayPal cleared',
    'vendor.prep_queue': 'Preparation Queue',
    'vendor.prep_sub': 'Awaiting kitchen/packing',
    'vendor.catalog_inventory': 'Catalog Inventory',
    'vendor.catalog_sub': 'In marketplace database',
    'vendor.store_rating': 'Store Rating',
    'vendor.rating_sub': '98% Satisfied Clients',
    'vendor.prep_manager': 'Preparation Queues Manager',
    'vendor.prep_clear': 'Prep List Clear',
    'vendor.prep_clear_desc': 'No new confirmed purchases awaiting prepared markers.',
    'vendor.mark_prepared': 'Mark Package Prepared',
    'vendor.active_listings': 'My Active Inventory Products',
    'vendor.no_listings': 'No Active Listings',
    'vendor.no_listings_desc': 'Use the listing creation board to add product stock.',
    'vendor.create_listing': 'Create Product Listing',
    'vendor.product_title': 'Product Title',
    'vendor.description': 'Description Details',
    'vendor.retail_price': 'Retail Price ($)',
    'vendor.compare_price': 'Compare Price ($)',
    'vendor.department': 'Department',
    'vendor.stock': 'Stock Inventory',
    'vendor.image_preset': 'Select Catalog Image Preset',
    'vendor.submit_listing': 'Publish New Listing',

    // Rider Dashboard
    'rider.portal': 'Rider Courier Portal',
    'rider.portal_desc': 'Accept delivery invoices, manage active driving maps and earn payouts',
    'rider.my_active': 'My Active Drives',
    'rider.idle': 'Drives Idle',
    'rider.idle_desc': 'Claim an invoice from the available pool below.',
    'rider.unassigned': 'Unassigned Logistics Pool',
    'rider.pool_clear': 'Neighborhood Pool Clear',
    'rider.pool_clear_desc': 'No new unallocated order invoices in this zone.',
    'rider.accept_trip': 'Accept Delivery Trip Request',
    'rider.no_nav': 'No Active Navigation Routes Selected',
    'rider.no_nav_desc': 'Click on any allocated trip from "My Active Drives" in the sidebar list to render driving maps, phone dials and status triggers.',
    'rider.nav_control': 'Logistics Navigator Control Board',
    'rider.receiver': 'Receiver Client',
    'rider.store': 'Store Merchant',
    'rider.remark': 'Remark Note',
    'rider.advance': 'Advance Shipping Stage',
    'rider.ship_out': '1. Ship Package Out',
    'rider.start_gps': '2. Start GPS Drive',
    'rider.confirm_handover': '3. Confirm Handover',
    'rider.failed_trip': 'Failed Trip',

    // Admin Dashboard
    'admin.console': 'Administrative dispatch Console',
    'admin.console_desc': 'Allocate regional order deliveries, audit active rider fleets and assess global revenue',
    'admin.gross_sales': 'Gross Logistics Sales',
    'admin.fleet_size': 'Logistics Fleet Size',
    'admin.fulfillment': 'Order Fulfillment Rate',
    'admin.enrollment': 'Merchant Enrollment Queue',
    'admin.no_merchants': 'Merchant Enrollments Clear',
    'admin.approve': 'Approve Enrollment',
    'admin.reject': 'Reject & Archive',
    'admin.active_fleets': 'Active Logistics Fleet Monitor',
    'admin.idle_couriers': 'Idle Couriers Pool',
    'admin.logistics_queue': 'Logistics Preparations Queue',
    'admin.portal': 'Administrative Dispatch Console',
    'admin.portal_desc': 'Allocate regional order deliveries, audit active rider fleets and assess global revenue',
    'admin.sales_sub': '+14.2% from last week',
    'admin.fleet_sub': 'Idle / Available',
    'admin.fulfillment_completed': 'Completed',
    'admin.fulfillment_sub': '0.8% Returned / Rejected',
    'admin.accounts': 'Registered Accounts',
    'admin.accounts_members': 'Members',
    'admin.accounts_sub': 'Customers, riders & sellers',
    'admin.revenue_trend': 'Gross Revenue Trend',
    'admin.revenue_sub': 'Weekly sales curve',
    'admin.mon': 'Mon',
    'admin.wed': 'Wed',
    'admin.fri': 'Fri',
    'admin.today': 'Today',
    'admin.distribution': 'Fulfillment Distribution',
    'admin.electronics': 'Electronics / Gadgets',
    'admin.share': 'share',
    'admin.fashion': 'Fashion / Apparel',
    'admin.groceries': 'Organic Groceries',
    'admin.dispatch_queue': 'Logistics Dispatch Queue',
    'admin.queue_idle': 'Logistics Queue Idle',
    'admin.queue_idle_desc': 'No prepared packages awaiting manual rider dispatch coordinates.',
    'admin.invoice_order': 'Invoice Order',
    'admin.select_courier': 'Select Courier',
    'admin.cleared_invoices': 'Cleared Purchase Invoices',
    'admin.no_completed': 'No Completed Invoices',
    'admin.no_completed_desc': 'Cleared invoices print details once order deliveries succeed.',
    'admin.print_invoice': 'Print Invoice',
    'admin.vendor_applications': 'Merchant Store Applications Audit',
    'admin.licensing_checks': 'Awaiting Licensing Checks',
    'admin.all_audited': 'All Applications Audited',
    'admin.all_audited_desc': 'No pending merchant catalog enrollment requests awaiting coordination.',
    'admin.reject_app': 'Reject Application',
    'admin.approve_app': 'Approve & Activate',
    'admin.rider_monitor': 'Active Rider Fleet Monitor',
    'admin.rating': 'Rating',
    'admin.on_active_trip': 'On Active Trip',
    'admin.couriers': 'Couriers',
    'admin.to': 'To',
    'admin.items_total': 'Items Total',
    'admin.dispatch': 'Dispatch',
    'admin.cleared_total': 'Cleared total',
    'admin.paid': 'Paid',
    'admin.plate': 'Plate'
  },
  kh: {
    // Nav
    'nav.home': 'ទំព័រដើម',
    'nav.explore': 'ស្វែងរកផលិតផល',
    'nav.deliveries': 'ការដឹកជញ្ជូនរបស់ខ្ញុំ',
    'nav.profile': 'ការកំណត់ប្រវត្តិរូប',
    'nav.signin': 'ចូលគណនី',
    'nav.signout': 'ចាកចេញពីគណនី',
    'nav.portal': 'ច្រកសាកល្បងរហ័ស',
    
    // Home Hero & Section Headers
    'home.badge': 'វេទិកាភស្តុភារលក់ទំនិញលំដាប់លេខ ១',
    'home.hero_title': 'ការទិញទំនិញលំដាប់ខ្ពស់។',
    'home.hero_subtitle': 'ការតាមដានពេលវេលាជាក់ស្តែង។',
    'home.hero_desc': 'បទពិសោធន៍ទិញទំនិញជំនាន់ថ្មីដែលជ្រើសរើសពីអ្នកលក់លំដាប់កំពូលក្នុងតំបន់។ ទូទាត់ប្រាក់ភ្លាមៗដោយប្រើ KHQR និងមើលអ្នកដឹកជញ្ជូនធ្វើដំណើរលើផែនទីផ្ទាល់។',
    'home.search_ph': 'ស្វែងរកកាសស្តាប់ត្រចៀក អាវធំ ផ្លែឈើ...',
    'home.search': 'ស្វែងរក',
    'home.trending_searches': 'ការស្វែងរកពេញនិយម៖',
    'home.categories_title': 'ស្វែងរកប្រភេទកំពូលៗ',
    'home.categories_subtitle': 'ជ្រើសរើសប្រភេទផលិតផលដើម្បីចម្រោះការស្វែងរករបស់អ្នក',
    'home.all_products': 'ផលិតផលទាំងអស់',
    'home.picks_title': 'ទំនិញពេញនិយមប្រចាំថ្ងៃ',
    'home.picks_subtitle': 'ផលិតផលដែលជ្រើសរើសសម្រិតសម្រាំងពីអ្នកលក់ដែលបានបញ្ជាក់របស់យើង',
    'home.updated_hourly': 'ធ្វើបច្ចុប្បន្នភាពរៀងរាល់ម៉ោង',
    
    // Cards
    'home.rewards_title': 'រង្វាន់ Sleek Loyalty',
    'home.rewards_desc': 'ទទួលបានពិន្ទុត្រឡប់មកវិញ 5% រាល់ការទិញតាម KHQR ឬ PayPal ។ ប្រើប្រាស់ពិន្ទុរបស់អ្នកសម្រាប់ទូទាត់ការបញ្ជាទិញផ្ទាល់។',
    'home.affiliate_title': 'ភាពជាដៃគូសាខា',
    'home.affiliate_desc': 'ចែករំលែកតំណភ្ជាប់ណែនាំផ្ទាល់ខ្លួនរបស់អ្នក។ ទទួលបានកម្រៃជើងសារ 2% ពេញមួយជីវិតរាល់ពេលមិត្តភក្តិទិញទំនិញជោគជ័យ!',
    
    // UI Elements
    'ui.cart': 'កន្ត្រកទំនិញ',
    'ui.add_cart': 'បន្ថែមទៅកន្ត្រក',
    'ui.checkout': 'បន្តទៅការទូទាត់',
    'ui.subtotal': 'សរុបសរុប',
    'ui.discount': 'ចំនួនបញ្ចុះតម្លៃ',
    'ui.fee': 'ថ្លៃដឹកជញ្ជូន',
    'ui.total': 'សរុបចុងក្រោយ',
    'ui.place_order': 'អនុញ្ញាតការបង់ប្រាក់សុវត្ថិភាព',
    
    // Categories
    'cat.all': 'បញ្ជីទាំងអស់',
    'cat.electronics': 'គ្រឿងអេឡិចត្រូនិច & ឧបករណ៍',
    'cat.apparel': 'សម្លៀកបំពាក់ & ម៉ូត',
    'cat.groceries': 'គ្រឿងទេសសរីរាង្គ',
    
    // Status
    'status.pending': 'រង់ចាំការបង់ប្រាក់',
    'status.confirmed': 'បានបញ្ជាក់ការបញ្ជាទិញ',
    'status.packing': 'កំពុងរៀបចំ & វេចខ្ចប់',
    'status.shipping': 'បានបញ្ជូនសម្រាប់ដឹកជញ្ជូន',
    'status.out_for_delivery': 'កំពុងដឹកជញ្ជូនទៅកាន់អ្នក',
    'status.delivered': 'ដឹកជញ្ជូនជោគជ័យ',
    'status.failed': 'ការដឹកជញ្ជូនបរាជ័យ',
    
    // Tracking
    'tracking.title': 'ប្រព័ន្ធតាមដានការដឹកជញ្ជូនផ្ទាល់',
    'tracking.subtitle': 'ការបង្ហាញផ្លូវ GPS ថាមវន្ត និងការសម្របសម្រួល SSE នៅកម្ពុជា',
    'tracking.eta': 'ពេលវេលាប៉ាន់ស្មាននៃការមកដល់',
    'tracking.eta_unit': 'នាទី',
    'tracking.phone': 'ទាក់ទងអ្នកដឹក',
    
    // Address Form
    'form.receiver': 'ឈ្មោះពេញអ្នកទទួល',
    'form.phone': 'លេខទូរស័ព្ទទំនាក់ទំនង',
    'form.note': 'ចំណាំបន្ថែមសម្រាប់ការដឹកជញ្ជូន',
    'form.autodetect': 'ស្វែងរកទីតាំងខ្ញុំស្វ័យប្រវត្តិ',
    'form.remark_ph': 'ឧ. ចុចកណ្ដឹងទ្វារ / ទុកនៅតុខាងមុខ...',

    // Vendor Dashboard
    'vendor.portal': 'ច្រកទ្វារហាងអ្នកលក់',
    'vendor.portal_desc': 'តាមដានប្រាក់ចំណូលហាង រៀបចំការបញ្ជាទិញរបស់អតិថិជន និងបង្កើតស្តុកទំនិញ',
    'vendor.store_revenue': 'ប្រាក់ចំណូលហាង',
    'vendor.revenue_sub': 'ទូទាត់រួចរាល់តាម ABA / PayPal',
    'vendor.prep_queue': 'ជួររៀបចំកញ្ចប់អីវ៉ាន់',
    'vendor.prep_sub': 'កំពុងរង់ចាំរៀបចំ/វេចខ្ចប់',
    'vendor.catalog_inventory': 'កាតាឡុកស្តុកទំនិញ',
    'vendor.catalog_sub': 'នៅក្នុងមូលដ្ឋានទិន្នន័យទីផ្សារ',
    'vendor.store_rating': 'ការវាយតម្លៃហាង',
    'vendor.rating_sub': 'អតិថិជនពេញចិត្ត ៩៨%',
    'vendor.prep_manager': 'កម្មវិធីគ្រប់គ្រងជួររៀបចំ',
    'vendor.prep_clear': 'បញ្ជីរៀបចំបានសម្អាតរួចរាល់',
    'vendor.prep_clear_desc': 'មិនមានការបញ្ជាទិញដែលបានបញ្ជាក់ថ្មីរង់ចាំការរៀបចំឡើយ។',
    'vendor.mark_prepared': 'សម្គាល់ថាកញ្ចប់អីវ៉ាន់បានរៀបចំរួចរាល់',
    'vendor.active_listings': 'ផលិតផលស្តុកសកម្មរបស់ខ្ញុំ',
    'vendor.no_listings': 'មិនមានទំនិញសកម្មឡើយ',
    'vendor.no_listings_desc': 'ប្រើផ្ទាំងបង្កើតទំនិញដើម្បីបន្ថែមស្តុកផលិតផល។',
    'vendor.create_listing': 'បង្កើតទំនិញថ្មី',
    'vendor.product_title': 'ចំណងជើងផលិតផល',
    'vendor.description': 'ព័ត៌មានលម្អិតពិពណ៌នា',
    'vendor.retail_price': 'តម្លៃលក់រាយ ($)',
    'vendor.compare_price': 'តម្លៃប្រៀបធៀប ($)',
    'vendor.department': 'ផ្នែក/ប្រភេទ',
    'vendor.stock': 'ចំនួនស្តុកទំនិញ',
    'vendor.image_preset': 'ជ្រើសរើសរូបភាពផលិតផលគំរូ',
    'vendor.submit_listing': 'ផ្សព្វផ្សាយទំនិញថ្មី',

    // Rider Dashboard
    'rider.portal': 'ច្រកទ្វារអ្នកដឹកជញ្ជូន',
    'rider.portal_desc': 'ទទួលយកវិក្កយបត្រដឹកជញ្ជូន គ្រប់គ្រងផែនទីបើកបរ និងទទួលបានប្រាក់កម្រៃ',
    'rider.my_active': 'ការដឹកជញ្ជូនសកម្មរបស់ខ្ញុំ',
    'rider.idle': 'មិនមានការដឹកជញ្ជូនសកម្មទេ',
    'rider.idle_desc': 'ទទួលយកវិក្កយបត្រពីបញ្ជីដែលមានខាងក្រោម។',
    'rider.unassigned': 'បញ្ជីដឹកជញ្ជូនមិនទាន់បែងចែក',
    'rider.pool_clear': 'បញ្ជីក្នុងតំបន់ត្រូវបានសម្អាតអស់',
    'rider.pool_clear_desc': 'មិនមានវិក្កយបត្របញ្ជាទិញថ្មីដែលមិនទាន់បែងចែកក្នុងតំបន់នេះទេ។',
    'rider.accept_trip': 'ទទួលយកការស្នើសុំដឹកជញ្ជូន',
    'rider.no_nav': 'មិនទាន់មានផ្លូវតាមដានសកម្មត្រូវបានជ្រើសរើស',
    'rider.no_nav_desc': 'ចុចលើការដឹកជញ្ជូនណាមួយពី "ការដឹកជញ្ជូនសកម្មរបស់ខ្ញុំ" ក្នុងបញ្ជីចំហៀង ដើម្បីបង្ហាញផែនទី លេខទូរស័ព្ទ និងប៊ូតុងស្ថានភាព។',
    'rider.nav_control': 'ក្តារបញ្ជាប្រព័ន្ធតាមដានភស្តុភារ',
    'rider.receiver': 'អតិថិជនអ្នកទទួល',
    'rider.store': 'ហាងអ្នកលក់',
    'rider.remark': 'កំណត់ចំណាំ',
    'rider.advance': 'ជំហានដឹកជញ្ជូនបន្ទាប់',
    'rider.ship_out': '១. បញ្ជូនកញ្ចប់អីវ៉ាន់ចេញ',
    'rider.start_gps': '២. ចាប់ផ្តើមបើកបរតាម GPS',
    'rider.confirm_handover': '៣. បញ្ជាក់ការប្រគល់អីវ៉ាន់',
    'rider.failed_trip': 'ការដឹកជញ្ជូនបរាជ័យ',

    // Admin Dashboard
    'admin.console': 'ក្តារបញ្ជាការិយាល័យរដ្ឋបាល',
    'admin.console_desc': 'បែងចែកការដឹកជញ្ជូនទូទាំងតំបន់ ពិនិត្យក្រុមអ្នកដឹកជញ្ជូនសកម្ម និងវាយតម្លៃចំណូលសរុប',
    'admin.gross_sales': 'ចំណូលលក់ភស្តុភារសរុប',
    'admin.fleet_size': 'ចំនួនក្រុមអ្នកដឹកជញ្ជូន',
    'admin.fulfillment': 'អត្រាសម្រេចការបញ្ជាទិញ',
    'admin.enrollment': 'ជួរចុះឈ្មោះហាងអ្នកលក់',
    'admin.no_merchants': 'មិនមានការចុះឈ្មោះហាងថ្មីទេ',
    'admin.approve': 'អនុម័តការចុះឈ្មោះ',
    'admin.reject': 'បដិសេធ & រក្សាទុក',
    'admin.active_fleets': 'ការត្រួតពិនិត្យក្រុមអ្នកដឹកជញ្ជូនសកម្ម',
    'admin.idle_couriers': 'បញ្ជីអ្នកដឹកជញ្ជូនទំនេរ',
    'admin.logistics_queue': 'ជួរត្រៀមដឹកជញ្ជូនភស្តុភារ',
    'admin.portal': 'ក្តារបញ្ជាការិយាល័យរដ្ឋបាល',
    'admin.portal_desc': 'បែងចែកការដឹកជញ្ជូនទូទាំងតំបន់ ពិនិត្យក្រុមអ្នកដឹកជញ្ជូនសកម្ម និងវាយតម្លៃចំណូលសរុប',
    'admin.sales_sub': '+១៤.២% ពីសប្តាហ៍មុន',
    'admin.fleet_sub': 'ទំនេរ / អាចដឹកបាន',
    'admin.fulfillment_completed': 'បានសម្រេច',
    'admin.fulfillment_sub': '០.៨% ត្រឡប់មកវិញ / បដិសេធ',
    'admin.accounts': 'គណនីដែលបានចុះឈ្មោះ',
    'admin.accounts_members': 'សមាជិក',
    'admin.accounts_sub': 'អតិថិជន អ្នកដឹកជញ្ជូន និងអ្នកលក់',
    'admin.revenue_trend': 'និន្នាការចំណូលសរុប',
    'admin.revenue_sub': 'ខ្សែកោងការលក់ប្រចាំសប្តាហ៍',
    'admin.mon': 'ច័ន្ទ',
    'admin.wed': 'ពុធ',
    'admin.fri': 'សុក្រ',
    'admin.today': 'ថ្ងៃនេះ',
    'admin.distribution': 'ការបែងចែកការបំពេញភារកិច្ច',
    'admin.electronics': 'គ្រឿងអេឡិចត្រូនិច & ឧបករណ៍',
    'admin.share': 'ចំណែក',
    'admin.fashion': 'សម្លៀកបំពាក់ & ម៉ូត',
    'admin.groceries': 'គ្រឿងទេសសរីរាង្គ',
    'admin.dispatch_queue': 'ជួរដឹកជញ្ជូនភស្តុភារ',
    'admin.queue_idle': 'ជួរដឹកជញ្ជូនទំនេរ',
    'admin.queue_idle_desc': 'មិនមានកញ្ចប់អីវ៉ាន់ដែលបានរៀបចំរង់ចាំការបែងចែកអ្នកដឹកជញ្ជូនទេ។',
    'admin.invoice_order': 'វិក្កយបត្របញ្ជាទិញ',
    'admin.select_courier': 'ជ្រើសរើសអ្នកដឹកជញ្ជូន',
    'admin.cleared_invoices': 'វិក្កយបត្រទិញទំនិញដែលបានទូទាត់',
    'admin.no_completed': 'មិនទាន់មានវិក្កយបត្ររួចរាល់ទេ',
    'admin.no_completed_desc': 'វិក្កយបត្រដែលបានទូទាត់នឹងបង្ហាញព័ត៌មាននៅពេលការដឹកជញ្ជូនជោគជ័យ។',
    'admin.print_invoice': 'បោះពុម្ពវិក្កយបត្រ',
    'admin.vendor_applications': 'ការពិនិត្យពាក្យសុំបើកហាងអ្នកលក់',
    'admin.licensing_checks': 'រង់ចាំការត្រួតពិនិត្យអាជ្ញាប័ណ្ណ',
    'admin.all_audited': 'បានពិនិត្យពាក្យសុំទាំងអស់រួចរាល់',
    'admin.all_audited_desc': 'មិនមានពាក្យសុំចុះឈ្មោះហាងថ្មីរង់ចាំការសម្របសម្រួលទេ។',
    'admin.reject_app': 'បដិសេធពាក្យសុំ',
    'admin.approve_app': 'អនុម័ត & បើកដំណើរការ',
    'admin.rider_monitor': 'ការត្រួតពិនិត្យក្រុមអ្នកដឹកជញ្ជូនសកម្ម',
    'admin.rating': 'ការវាយតម្លៃ',
    'admin.on_active_trip': 'កំពុងដឹកជញ្ជូនសកម្ម',
    'admin.couriers': 'អ្នកដឹកជញ្ជូន',
    'admin.to': 'ទៅកាន់',
    'admin.items_total': 'សរុបតម្លៃទំនិញ',
    'admin.dispatch': 'បញ្ជូនទំនិញ',
    'admin.cleared_total': 'សរុបការទូទាត់',
    'admin.paid': 'បានបង់ប្រាក់',
    'admin.plate': 'ស្លាកលេខ'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('sleekcart_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sleekcart_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
