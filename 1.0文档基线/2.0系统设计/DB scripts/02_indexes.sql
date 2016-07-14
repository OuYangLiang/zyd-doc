--
-- 会员标识
--
create unique index idx_party_identify_1 on party_identify(recommend_code);



--
-- 会员联系信息
--
create unique index idx_party_contact_info_1 on party_contact_info(party_id, cntct_type, cntct_seq);



--
-- 会员账号
--
create unique index idx_party_account_1 on party_account(acnt_val);
create unique index idx_party_account_2 on party_account(party_id, acnt_type);



--
-- 第三方账号
--
create unique index idx_third_party_account_1 on third_party_account(acnt_type, acnt_val);
create unique index idx_third_party_account_2 on third_party_account(party_id, acnt_type);



--
-- 账号密码
--
create unique index idx_party_password_1 on party_password(party_id, pwd_type);



--
-- 积分变化明细
--
create index idx_point_event_1 on point_event(party_id, event_ts);
create unique index idx_point_event_2 on point_event(order_num, scenario);



--
-- 会员等级因素累计值
--
create unique index idx_party_level_factor_1 on party_level_factor(party_id, factor);



--
-- 会员等级成长明细
--
create index idx_party_level_detail_1 on party_level_detail(party_id, event_ts);
create unique index idx_party_level_detail_2 on party_level_detail(order_num, scenario, factor);



--
-- 会员等级变化历史
--
create index idx_party_level_history_1 on party_level_history(party_id, level_chg_ts);



--
-- 会员领用权益事件
--
create index idx_rights_usage_1 on rights_usage(party_id, event_ts);
create index idx_rights_usage_2 on rights_usage(party_id, level, event_ts);
create index idx_rights_usage_3 on rights_usage(party_id, rights, event_ts);



--
-- 推荐人列表
--
create index idx_recommended_list_1 on recommended_list(party_id);



--
-- 收藏商品
--
create unique index idx_collected_list_1 on collected_list(party_id, cmmdty_id);
create index idx_collected_list_2 on collected_list(party_id, collected_time);



--
-- 购物车
--
create unique index idx_shopping_cart_1 on shopping_cart(party_id, cmmdty_id);
create index idx_shopping_cart_2 on shopping_cart(party_id, add_time);



--
-- 紫砂壶
--
create unique index idx_teapot_1 on teapot(cmmdty_num);
create index idx_teapot_2 on teapot(category, current_price);
create index idx_teapot_3 on teapot(category, type, current_price);
create index idx_teapot_4 on teapot(category, shape, current_price);
create index idx_teapot_5 on teapot(category, material, current_price);
create index idx_teapot_6 on teapot(category, size, current_price);
create index idx_teapot_7 on teapot(category, level, current_price);
create index idx_teapot_8 on teapot(category, price_region, current_price);
create index idx_teapot_9 on teapot(category, num_sales);
create index idx_teapot_10 on teapot(category, type, num_sales);
create index idx_teapot_11 on teapot(category, shape, num_sales);
create index idx_teapot_12 on teapot(category, material, num_sales);
create index idx_teapot_13 on teapot(category, size, num_sales);
create index idx_teapot_14 on teapot(category, level, num_sales);
create index idx_teapot_15 on teapot(category, price_region, num_sales);
create index idx_teapot_16 on teapot(category, shelves_time);
create index idx_teapot_17 on teapot(category, type, shelves_time);
create index idx_teapot_18 on teapot(category, shape, shelves_time);
create index idx_teapot_19 on teapot(category, material, shelves_time);
create index idx_teapot_20 on teapot(category, size, shelves_time);
create index idx_teapot_21 on teapot(category, level, shelves_time);
create index idx_teapot_22 on teapot(category, price_region, shelves_time);
create index idx_teapot_23 on teapot(category, num_evaluated);
create index idx_teapot_24 on teapot(category, type, num_evaluated);
create index idx_teapot_25 on teapot(category, shape, num_evaluated);
create index idx_teapot_26 on teapot(category, material, num_evaluated);
create index idx_teapot_27 on teapot(category, size, num_evaluated);
create index idx_teapot_28 on teapot(category, level, num_evaluated);
create index idx_teapot_29 on teapot(category, price_region, num_evaluated);



--
-- 待审核紫砂壶
--
create unique index idx_pending_teapot_1 on pending_teapot(cmmdty_num);



--
-- 精品
--
create unique index idx_boutique_1 on boutique(cmmdty_num);
create index idx_boutique_2 on boutique(category, shelves_time);
create index idx_boutique_3 on boutique(category, current_price);
create index idx_boutique_4 on boutique(category, num_sales);
create index idx_boutique_5 on boutique(shelves_time);
create index idx_boutique_6 on boutique(current_price);
create index idx_boutique_7 on boutique(num_sales);



--
-- 待审核精品
--
create unique index idx_pending_boutique_1 on pending_boutique(cmmdty_num);



--
-- 茶叶
--
create unique index idx_tea_1 on tea(cmmdty_num);
create index idx_tea_2 on tea(current_price);
create index idx_tea_3 on tea(price_region, current_price);
create index idx_tea_4 on tea(tea_type, current_price);
create index idx_tea_5 on tea(level, current_price);
create index idx_tea_6 on tea(packing, current_price);
create index idx_tea_7 on tea(place_of_origin, current_price);
create index idx_tea_8 on tea(num_sales);
create index idx_tea_9 on tea(price_region, num_sales);
create index idx_tea_10 on tea(tea_type, num_sales);
create index idx_tea_11 on tea(level, num_sales);
create index idx_tea_12 on tea(packing, num_sales);
create index idx_tea_13 on tea(place_of_origin, num_sales);
create index idx_tea_14 on tea(shelves_time);
create index idx_tea_15 on tea(price_region, shelves_time);
create index idx_tea_16 on tea(tea_type, shelves_time);
create index idx_tea_17 on tea(level, shelves_time);
create index idx_tea_18 on tea(packing, shelves_time);
create index idx_tea_19 on tea(place_of_origin, shelves_time);



--
-- 待审核茶叶
--
create unique index idx_pending_tea_1 on pending_tea(cmmdty_num);



--
-- 商品图片
--
create unique index idx_commodity_image_1 on commodity_image(cmmdty_id, image_type, image_seq);



--
-- 商品清单
--
create unique index idx_item_list_1 on item_list(cmmdty_id, item_desc);



--
-- 商品属性
--
create unique index idx_commodity_property_1 on commodity_property(cmmdty_id, prop_name);
create unique index idx_commodity_property_2 on commodity_property(cmmdty_id, seq);



--
-- 属性配置
--
create unique index idx_property_config_1 on property_config(category, seq);



--
-- 商品评价
--
create index idx_commodity_evaluation_1 on commodity_evaluation(cmmdty_id, eval_level, event_ts);
create index idx_commodity_evaluation_2 on commodity_evaluation(cmmdty_id, contains_image, event_ts);
create index idx_commodity_evaluation_3 on commodity_evaluation(cmmdty_id, contains_added_eval, event_ts);
create index idx_commodity_evaluation_4 on commodity_evaluation(party_id, event_ts);



--
-- 商品追评
--
create index idx_added_evaluation_1 on added_evaluation(eval_id, event_ts);



--
-- 评价标签
--
create index idx_evaluation_label_1 on evaluation_label(cmmdty_id, hit_times);
create unique index idx_evaluation_label_2 on evaluation_label(cmmdty_id, label);



--
-- 评价图片
--
create unique index idx_evaluation_image_1 on evaluation_image(eval_id, image_seq);



--
-- 商品咨询
--
create index idx_commodity_enquiring_1 on commodity_enquiring(cmmdty_id, event_ts);
create index idx_commodity_enquiring_2 on commodity_enquiring(party_id, event_ts);



--
-- 库存变化历史
--
create index idx_repository_history_1 on repository_history(cmmdty_id, event_ts);
create index idx_repository_history_2 on repository_history(cmmdty_id, chg_type, event_ts);



--
-- 赠品
--
create index idx_gift_1 on gift(cmmdty_id, seq);



--
-- 赠品与商口的包含关系
--
create unique index idx_gift_containing_1 on gift_containing(gift_id, cmmdty_id);



--
-- 推荐商品
--
create unique index idx_recommended_commodity_1 on recommended_commodity(cmmdty_id, seq);



--
-- 标签
--
create unique index idx_label_1 on label(label_style, label_val);



--
-- 商品与标签的关系
--
create index idx_commodity_label_rel_1 on commodity_label_rel(label_id);



--
-- 购物订单
--
create unique index idx_purchase_order_1 on purchase_order(order_num);
create index idx_purchase_order_2 on purchase_order(party_id, submit_time);



--
-- 订单发票信息
--
create unique index idx_invoice_1 on invoice(order_id);



--
-- 订单事件
--
create index idx_order_event_1 on order_event(order_id, event_ts);



--
-- 订单状态变化日志
--
create index idx_order_log_1 on order_log(order_id, order_status_before, order_status_after);
create index idx_order_log_2 on order_log(order_id, order_status_after);
create index idx_order_log_3 on order_log(order_id, event_ts);



--
-- 订单商品
--
create unique index idx_order_commodity_1 on order_commodity(order_id, cmmdty_id);



--
-- 订单商品清单
--
create index idx_order_item_list_1 on order_item_list(order_cmmdty_id);



--
-- 订单赠品
--
create index idx_order_gift_1 on order_gift(order_id);
create index idx_order_gift_2 on order_gift(order_cmmdty_id);



--
-- 订单赠品清单
--
create index idx_order_gift_item_list_1 on order_gift_item_list(order_gift_id);



--
-- 退换货订单
--
create unique index idx_return_order_1 on return_order(return_order_num);
create index idx_return_order_2 on return_order(party_id, submit_time);
create index idx_return_order_3 on return_order(order_id, submit_time);



--
-- 退换货订单事件
--
create index idx_return_order_event_1 on return_order_event(return_order_id, event_ts);



--
-- 退换货订单状态变化日志
--
create index idx_return_order_log_1 on return_order_log(return_order_id, order_status_before, order_status_after);
create index idx_return_order_log_2 on return_order_log(return_order_id, order_status_after);
create index idx_return_order_log_3 on return_order_log(return_order_id, event_ts);



--
-- 退换货订单物流信息
--
create unique index idx_return_order_logistics_1 on return_order_logistics(return_order_id, logistics_type);



--
-- 退换货订单退款信息
--
create index idx_return_order_refund_info_1 on return_order_refund_info(party_id, submit_time);



--
-- 退换货物品
--
create unique index idx_return_order_commodity_1 on return_order_commodity(return_order_id);



--
-- 退换货物品清单
--
create index idx_return_order_item_list_1 on return_order_item_list(return_order_cmmdty_id);



--
-- 省
--
create unique index idx_province_1 on province(sort);



--
-- 市
--
create unique index idx_city_1 on city(pro_id, sort);



--
-- 区镇
--
create index idx_district_1 on district(city_id);

