--
-- 会员标识
--
create table party_identify(
    party_id                    bigint unsigned     not null    auto_increment,
    recommend_code              char(6)             not null,
    register_date               timestamp           not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (party_id)
)engine=innodb default charset=utf8;



--
-- 会员基本信息
--
create table party_info(
    party_id                    bigint unsigned     not null,
    party_name                  varchar(20),
    party_alias                 varchar(30),
    gender                      char(8)             not null,
    birthday                    date,
    education                   char(8)             not null,
    marital_status              char(8)             not null,
    industry                    char(8)             not null,
    level_of_income             char(8)             not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (party_id)
)engine=innodb default charset=utf8;



--
-- 会员联系信息
--
create table party_contact_info(
    cntct_id                    bigint unsigned     not null    auto_increment,
    cntct_type                  char(8)             not null,
    cntct_seq                   tinyint unsigned    not null,
    cntct_name                  varchar(20)         not null,
    cntct_mobile                varchar(20)         not null,
    cntct_country               char(8)             not null,
    cntct_state                 varchar(20)         not null,
    cntct_city                  varchar(20)         not null,
    cntct_town_code             varchar(20)         not null,
    cntct_town                  varchar(30)         not null,
    cntct_street                varchar(100),
    cntct_address               varchar(255)        not null,
    cntct_post_code             char(6),
    prefer_flag                 boolean             not null,
    party_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (cntct_id)
)engine=innodb default charset=utf8;



--
-- 会员账号
--
create table party_account(
    acnt_id                     bigint unsigned     not null    auto_increment,
    acnt_type                   char(8)             not null,
    acnt_val                    varchar(100)        not null,
    acnt_status                 char(8)             not null,
    party_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (acnt_id)
)engine=innodb default charset=utf8;



--
-- 第三方账号
--
create table third_party_account(
    acnt_id                     bigint unsigned     not null    auto_increment,
    acnt_type                   char(8)             not null,
    acnt_val                    varchar(100)        not null,
    party_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (acnt_id)
)engine=innodb default charset=utf8;



--
-- 账号密码
--
create table party_password(
    pwd_id                      bigint unsigned     not null    auto_increment,
    pwd_type                    char(8)             not null,
    pwd_val                     char(128)           not null,
    pwd_salt                    tinyint unsigned    not null,
    pwd_strongth                char(8)             not null,
    first_wrong_check_time      timestamp,
    wrong_check_times           tinyint unsigned    not null,
    pwd_status                  char(8)             not null,
    party_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (pwd_id)
)engine=innodb default charset=utf8;



--
-- 会员积分
--
create table party_point(
    party_id                    bigint unsigned     not null,
    total_amt                   decimal(16,2)       not null,
    used_amt                    decimal(16,2)       not null,
    balance_amt                 decimal(16,2)       not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (party_id)
)engine=innodb default charset=utf8;



--
-- 积分变化明细
--
create table point_event(
    event_id                    bigint unsigned     not null    auto_increment,
    scenario                    char(8)             not null,
    event_ts                    timestamp           not null,
    order_num                   varchar(25)         not null,
    return_order_num            varchar(25),
    order_amt                   decimal(16,2)       not null,
    change_qty                  decimal(16,2)       not null,
    point_balance_before        decimal(16,2)       not null,
    party_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (event_id)
)engine=innodb default charset=utf8;



--
-- 会员等级
--
create table party_level(
    party_id                    bigint unsigned     not null,
    level                       char(8)             not null,
    level_chg_type              char(8)             not null,
    level_chg_ts                timestamp           not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (party_id)
)engine=innodb default charset=utf8;



--
-- 会员等级因素累计值
--
create table party_level_factor(
    factor_id                   bigint unsigned     not null    auto_increment,
    factor                      char(8)             not null,
    factor_val                  decimal(16,2)       not null,
    party_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (factor_id)
)engine=innodb default charset=utf8;



--
-- 会员等级成长明细
--
create table party_level_detail(
    detail_id                   bigint unsigned     not null    auto_increment,
    scenario                    char(8)             not null,
    event_ts                    timestamp           not null,
    order_num                   varchar(25)         not null,
    return_order_num            varchar(25),
    order_amt                   decimal(16,2)       not null,
    factor                      char(8)             not null,
    change_qty                  decimal(16,2)       not null,
    balance_before              decimal(16,2)       not null,
    party_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (detail_id)
)engine=innodb default charset=utf8;



--
-- 会员等级变化历史
--
create table party_level_history(
    his_id                      bigint unsigned     not null    auto_increment,
    level_chg_type              char(8)             not null,
    level_chg_ts                timestamp           not null,
    level_before                char(8)             not null,
    level_after                 char(8)             not null,
    party_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (his_id)
)engine=innodb default charset=utf8;



--
-- 会员等级配置
--
create table level_config(
    level                       char(8)             not null,
    level_before                char(8),
    level_after                 char(8),
    primary key (level)
)engine=innodb default charset=utf8;



--
-- 会员等级因素配置
--
create table level_factor_config(
    level                       char(8)             not null,
    factor                      char(8)             not null,
    factor_val                  decimal(16,2)       not null,
    primary key (level, factor)
)engine=innodb default charset=utf8;



--
-- 会员权益配置
--
create table rights_config(
    rights                      char(8)             not null,
    rights_description          varchar(255)        not null,
    primary key (rights)
)engine=innodb default charset=utf8;



--
-- 会员等级与权益的关系
--
create table level_rights_rel(
    level                       char(8)             not null,
    rights                      char(8)             not null,
    level_rights_rate           decimal(16,2)       not null,
    limit_times                 smallint unsigned   not null,
    limit_val                   decimal(16,2)       not null,
    primary key (level, rights)
)engine=innodb default charset=utf8;



--
-- 会员领用权益事件
--
create table rights_usage(
    event_id                    bigint unsigned     not null    auto_increment,
    level                       char(8)             not null,
    rights                      char(8)             not null,
    event_ts                    char(8)             not null,
    party_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (event_id)
)engine=innodb default charset=utf8;



--
-- 推荐人列表
--
create table recommended_list(
    presentee_id                bigint unsigned     not null,
    party_id                    bigint unsigned     not null,
    primary key (presentee_id)
)engine=innodb default charset=utf8;



--
-- 收藏商品
--
create table collected_list(
    collected_id                bigint unsigned     not null    auto_increment,
    party_id                    bigint unsigned     not null,
    cmmdty_id                   bigint unsigned     not null,
    collected_time              timestamp           not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (collected_id)
)engine=innodb default charset=utf8;



--
-- 购物车
--
create table shopping_cart(
    shopping_id                 bigint unsigned     not null    auto_increment,
    party_id                    bigint unsigned     not null,
    cmmdty_id                   bigint unsigned     not null,
    qty_to_buy                  smallint unsigned   not null,
    add_time                    timestamp           not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (shopping_id)
)engine=innodb default charset=utf8;



--
-- 商品
--
create table commodity(
    cmmdty_id                   bigint unsigned     not null    auto_increment,
    category                    char(8)             not null,
    introducer                  varchar(10)         not null,
    auditor                     varchar(10),
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (cmmdty_id)
)engine=innodb default charset=utf8;



--
-- 紫砂壶
--
create table teapot(
    cmmdty_id                   bigint unsigned     not null,
    category                    char(8)             not null,
    cmmdty_name                 varchar(50)         not null,
    cmmdty_num                  char(8)             not null,
    cmmdty_desc                 varchar(512)        not null,
    num_stored                  int unsigned        not null,
    num_sales                   int unsigned        not null,
    num_evaluated               int unsigned        not null,
    num_enquired                int unsigned        not null,
    proposed_price              decimal(16,2)       not null,
    current_price               decimal(16,2)       not null,
    shelves_time                date                not null,
    unshelves_time              date,
    default_image_addrs         varchar(255)        not null,
    `type`                      char(8)             not null,
    shape                       char(8)             not null,
    material                    char(8)             not null,
    `size`                      smallint unsigned   not null,
    `level`                     char(8)             not null,
    producer                    varchar(20)         not null,
    sales_mode                  char(8)             not null,
    price_region                char(8)             not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (cmmdty_id)
)engine=innodb default charset=utf8;



--
-- 待审核紫砂壶
--
create table pending_teapot(
    cmmdty_id                   bigint unsigned     not null,
    category                    char(8)             not null,
    cmmdty_name                 varchar(50)         not null,
    cmmdty_num                  char(8)             not null,
    cmmdty_desc                 varchar(512)        not null,
    num_stored                  int unsigned        not null,
    num_sales                   int unsigned        not null,
    num_evaluated               int unsigned        not null,
    num_enquired                int unsigned        not null,
    proposed_price              decimal(16,2)       not null,
    current_price               decimal(16,2)       not null,
    shelves_time                date                not null,
    unshelves_time              date,
    default_image_addrs         varchar(255)        not null,
    `type`                      char(8)             not null,
    shape                       char(8)             not null,
    material                    char(8)             not null,
    `size`                      smallint unsigned   not null,
    `level`                     char(8)             not null,
    producer                    varchar(20)         not null,
    sales_mode                  char(8)             not null,
    price_region                char(8)             not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (cmmdty_id)
)engine=innodb default charset=utf8;



--
-- 精品
--
create table boutique(
    cmmdty_id                   bigint unsigned     not null,
    category                    char(8)             not null,
    cmmdty_name                 varchar(50)         not null,
    cmmdty_num                  char(8)             not null,
    cmmdty_desc                 varchar(512)        not null,
    num_stored                  int unsigned        not null,
    num_sales                   int unsigned        not null,
    num_evaluated               int unsigned        not null,
    num_enquired                int unsigned        not null,
    proposed_price              decimal(16,2)       not null,
    current_price               decimal(16,2)       not null,
    shelves_time                date                not null,
    unshelves_time              date,
    default_image_addrs         varchar(255)        not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (cmmdty_id)
)engine=innodb default charset=utf8;



--
-- 待审核精品
--
create table pending_boutique(
    cmmdty_id                   bigint unsigned     not null,
    category                    char(8)             not null,
    cmmdty_name                 varchar(50)         not null,
    cmmdty_num                  char(8)             not null,
    cmmdty_desc                 varchar(512)        not null,
    num_stored                  int unsigned        not null,
    num_sales                   int unsigned        not null,
    num_evaluated               int unsigned        not null,
    num_enquired                int unsigned        not null,
    proposed_price              decimal(16,2)       not null,
    current_price               decimal(16,2)       not null,
    shelves_time                date                not null,
    unshelves_time              date,
    default_image_addrs         varchar(255)        not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (cmmdty_id)
)engine=innodb default charset=utf8;



--
-- 茶叶
--
create table tea(
    cmmdty_id                   bigint unsigned     not null,
    category                    char(8)             not null,
    cmmdty_name                 varchar(50)         not null,
    cmmdty_num                  char(8)             not null,
    cmmdty_desc                 varchar(512)        not null,
    num_stored                  int unsigned        not null,
    num_sales                   int unsigned        not null,
    num_evaluated               int unsigned        not null,
    num_enquired                int unsigned        not null,
    proposed_price              decimal(16,2)       not null,
    current_price               decimal(16,2)       not null,
    shelves_time                date                not null,
    unshelves_time              date,
    default_image_addrs         varchar(255)        not null,
    tea_type                    char(8)             not null,
    place_of_origin             varchar(20)         not null,
    `level`                     char(8)             not null,
    packing                     char(8)             not null,
    price_region                char(8)             not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (cmmdty_id)
)engine=innodb default charset=utf8;



--
-- 待审核茶叶
--
create table pending_tea(
    cmmdty_id                   bigint unsigned     not null,
    category                    char(8)             not null,
    cmmdty_name                 varchar(50)         not null,
    cmmdty_num                  char(8)             not null,
    cmmdty_desc                 varchar(512)        not null,
    num_stored                  int unsigned        not null,
    num_sales                   int unsigned        not null,
    num_evaluated               int unsigned        not null,
    num_enquired                int unsigned        not null,
    proposed_price              decimal(16,2)       not null,
    current_price               decimal(16,2)       not null,
    shelves_time                date                not null,
    unshelves_time              date,
    default_image_addrs         varchar(255)        not null,
    tea_type                    char(8)             not null,
    place_of_origin             varchar(20)         not null,
    `level`                     char(8)             not null,
    packing                     char(8)             not null,
    price_region                char(8)             not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (cmmdty_id)
)engine=innodb default charset=utf8;



--
-- 商品图片
--
create table commodity_image(
    image_id                    bigint unsigned     not null    auto_increment,
    cmmdty_id                   bigint unsigned     not null,
    image_seq                   tinyint unsigned    not null,
    image_addrs                 varchar(255)        not null,
    image_type                  char(8)             not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (image_id)
)engine=innodb default charset=utf8;



--
-- 包装清单
--
create table item_list(
    item_id                     bigint unsigned     not null    auto_increment,
    item_desc                   varchar(100)        not null,
    item_qty                    smallint unsigned   not null,
    cmmdty_id                   bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key(item_id)
)engine=innodb default charset=utf8;



--
-- 商品属性
--
create table commodity_property(
    property_id                 bigint unsigned     not null    auto_increment,
    cmmdty_id                   bigint unsigned     not null,
    prop_name                   varchar(30)         not null,
    prop_val                    varchar(50)         not null,
    seq                         tinyint unsigned    not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (property_id)
)engine=innodb default charset=utf8;



--
-- 属性配置
--
create table property_config(
    category                    char(8)             not null,
    prop_name                   varchar(30)         not null,
    seq                         tinyint unsigned    not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (category, prop_name)
)engine=innodb default charset=utf8;



--
-- 商品评价
--
create table commodity_evaluation(
    eval_id                     bigint unsigned     not null    auto_increment,
    eval_level                  char(8)             not null,
    num_of_stars                tinyint unsigned    not null,
    eval_content                varchar(512)        not null,
    event_ts                    timestamp           not null,
    contains_image              boolean             not null,
    contains_added_eval         boolean             not null,
    forbidden                   boolean             not null,
    cmmdty_id                   bigint unsigned     not null,
    party_id                    bigint unsigned     not null,
    order_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (eval_id)
)engine=innodb default charset=utf8;



--
-- 商品追评
--
create table added_evaluation(
    added_eval_id               bigint unsigned     not null    auto_increment,
    added_eval_type             char(8)             not null,
    added_eval_content          varchar(512)        not null,
    event_ts                    timestamp           not null,
    eval_id                     bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (added_eval_id)
)engine=innodb default charset=utf8;


--
-- 评价标签
--
create table evaluation_label(
    label_id                    bigint unsigned     not null    auto_increment,
    label                       varchar(30)         not null,
    hit_times                   int unsigned        not null,
    cmmdty_id                   bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (label_id)
)engine=innodb default charset=utf8;



--
-- 评价与标签的关系
--
create table evaluation_label_rel(
    eval_id                     bigint unsigned     not null,
    label_id                    bigint unsigned     not null,
    primary key (eval_id, label_id)
)engine=innodb default charset=utf8;



--
-- 评价图片
--
create table evaluation_image(
    image_id                    bigint unsigned     not null    auto_increment,
    eval_id                     bigint unsigned     not null,
    image_seq                   tinyint unsigned    not null,
    image_addrs                 varchar(255)        not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (image_id)
)engine=innodb default charset=utf8;



--
-- 商品咨询
--
create table commodity_enquiring(
    enquiring_id                bigint unsigned     not null    auto_increment,
    enquiring_content           varchar(500)        not null,
    event_ts                    timestamp           not null,
    cmmdty_id                   bigint unsigned     not null,
    party_id                    bigint unsigned     not null,
    answerer                    varchar(10),
    answer                      varchar(500),
    answer_ts                   timestamp,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (enquiring_id)
)engine=innodb default charset=utf8;



--
-- 库存变化历史
--
create table repository_history(
    his_id                      bigint unsigned     not null    auto_increment,
    chg_type                    char(8)             not null,
    event_ts                    timestamp           not null,
    num_stored_before           int unsigned        not null,
    chg_qty                     int unsigned        not null,
    unit_price                  decimal(16,2)       not null,
    total_price                 decimal(16,2)       not null,
    operator                    varchar(10),
    cmmdty_id                   bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (his_id)
)engine=innodb default charset=utf8;



--
-- 赠品
--
create table gift(
    gift_id                     bigint unsigned     not null    auto_increment,
    seq                         tinyint unsigned    not null,
    cmmdty_id                   bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (gift_id)
)engine=innodb default charset=utf8;



--
-- 赠品与商口的包含关系
--
create table gift_containing(
    rel_id                      bigint unsigned     not null    auto_increment,
    gift_id                     bigint unsigned     not null,
    cmmdty_id                   bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (rel_id)
)engine=innodb default charset=utf8;



--
-- 推荐商品
--
create table recommended_commodity(
    cmmdty_id                   bigint unsigned     not null    auto_increment,
    recommended_cmmdty_id       bigint unsigned     not null,
    seq                         tinyint unsigned    not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (cmmdty_id, recommended_cmmdty_id)
)engine=innodb default charset=utf8;



--
-- 标签
--
create table label(
    label_id                    bigint unsigned     not null    auto_increment,
    label_style                 char(8)             not null,
    label_val                   varchar(20)         not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (label_id)
)engine=innodb default charset=utf8;



--
-- 商品与标签的关系
--
create table commodity_label_rel(
    cmmdty_id                   bigint unsigned     not null,
    label_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key(cmmdty_id, label_id)
)engine=innodb default charset=utf8;



--
-- 购物订单
--
create table purchase_order(
    order_id                    bigint unsigned     not null    auto_increment,
    order_num                   varchar(20)         not null,
    submit_time                 timestamp           not null,
    order_status                char(8)             not null,
    order_total_price           decimal(16,2)       not null,
    point_consumed              decimal(16,2)       not null,
    logistics_amt               decimal(16,2)       not null,
    free_logistics_condition    decimal(16,2)       not null,
    free_logistics_amt          boolean             not null,
    order_should_payment        decimal(16,2)       not null,
    discount                    decimal(16,2)       not null,
    order_actual_payment        decimal(16,2)       not null,
    remarks                     varchar(255),
    remarks2                    varchar(255),
    party_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (order_id)
)engine=innodb default charset=utf8;



--
-- 订单发票信息
--
create table invoice(
    invoice_id                  bigint unsigned     not null    auto_increment,
    invoice_type                char(8)             not null,
    invoice_title               varchar(255)        not null,
    order_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key(invoice_id)
)engine=innodb default charset=utf8;



--
-- 订单事件
--
create table order_event(
    event_id                    bigint unsigned     not null    auto_increment,
    event_ts                    timestamp           not null,
    event_desc                  varchar(255)        not null,
    order_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (event_id)
)engine=innodb default charset=utf8;



--
-- 订单状态变化日志
--
create table order_log(
    log_id                      bigint unsigned     not null    auto_increment,
    order_status_before         char(8)             not null,
    order_status_after          char(8)             not null,
    operator_type               char(8)             not null,
    log_desc                    varchar(255),
    event_ts                    timestamp           not null,
    operator                    varchar(10)         not null,
    order_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (log_id)
)engine=innodb default charset=utf8;



--
-- 订单商品
--
create table order_commodity(
    order_cmmdty_id             bigint unsigned     not null    auto_increment,
    order_id                    bigint unsigned     not null,
    cmmdty_id                   bigint unsigned     not null,
    cmmdty_name                 varchar(50)         not null,
    proposed_price              decimal(16,2)       not null,
    actual_price                decimal(16,2)       not null,
    qty                         smallint unsigned   not null,
    default_image_addrs         varchar(255)        not null,
    commodity_status            char(8)             not null,
    evaluation_status           char(8)             not null,
    times_exchanged             tinyint unsigned    not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (order_cmmdty_id)
)engine=innodb default charset=utf8;



--
-- 订单商品清单
--
create table order_item_list(
    item_id                     bigint unsigned     not null    auto_increment,
    item_desc                   varchar(100)        not null,
    item_qty                    smallint unsigned   not null,
    order_cmmdty_id             bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key(item_id)
)engine=innodb default charset=utf8;



--
-- 订单赠品
--
create table order_gift(
    order_gift_id               bigint unsigned     not null    auto_increment,
    order_id                    bigint unsigned     not null,
    cmmdty_id                   bigint unsigned     not null,
    cmmdty_name                 varchar(50)         not null,
    proposed_price              decimal(16,2)       not null,
    qty                         smallint unsigned   not null,
    default_image_addrs         varchar(255)        not null,
    order_cmmdty_id             bigint unsigned     not null,
    commodity_status            char(8)             not null,
    evaluation_status           char(8)             not null,
    times_exchanged             tinyint unsigned    not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (order_gift_id)
)engine=innodb default charset=utf8;



--
-- 订单赠品清单
--
create table order_gift_item_list(
    item_id                     bigint unsigned     not null    auto_increment,
    item_desc                   varchar(100)        not null,
    item_qty                    smallint unsigned   not null,
    order_gift_id             bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key(item_id)
)engine=innodb default charset=utf8;



--
-- 订单物流信息
--
create table order_logistics(
    order_id                    bigint unsigned     not null,
    logistics_company_code      char(8)             not null,
    logistics_company_desc      varchar(20)         not null,
    logistics_num               varchar(50),
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (order_id)
)engine=innodb default charset=utf8;



--
-- 订单配送信息
--
create table order_contact_info(
    order_id                    bigint unsigned     not null,
    cntct_name                  varchar(20)         not null,
    cntct_mobile                varchar(20)         not null,
    cntct_country               char(8)             not null,
    cntct_state                 varchar(20)         not null,
    cntct_city                  varchar(20)         not null,
    cntct_town                  varchar(30)         not null,
    cntct_street                varchar(100),
    cntct_address               varchar(255)        not null,
    cntct_post_code             char(6),
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (order_id)
)engine=innodb default charset=utf8;



--
-- 订单支付信息
--
create table order_payment(
    order_id                    bigint unsigned     not null,
    payment_method              char(8)             not null,
    payment_channel             char(8)             not null,
    payment_account             varchar(100),
    payment_num                 varchar(50),
    payment_amt                 decimal(16,2)       not null,
    payment_time                timestamp,
    payment_status              char(8)             not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (order_id)
)engine=innodb default charset=utf8;



--
-- 退换货订单
--
create table return_order(
    return_order_id             bigint unsigned     not null    auto_increment,
    return_order_num            varchar(20)         not null,
    return_order_type           char(8)             not null,
    submit_time                 timestamp           not null,
    return_order_status         char(8)             not null,
    return_reason               char(8)             not null,
    return_reason_desc          varchar(255)        not null,
    should_refund_amt           decimal(16,2)       not null,
    actual_refund_amt           decimal(16,2)       not null,
    remarks                     varchar(255),
    order_id                    bigint unsigned     not null,
    party_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (return_order_id)
)engine=innodb default charset=utf8;



--
-- 退换货订单事件
--
create table return_order_event(
    event_id                    bigint unsigned     not null    auto_increment,
    event_ts                    timestamp           not null,
    event_desc                  varchar(255)        not null,
    return_order_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (event_id)
)engine=innodb default charset=utf8;



--
-- 退换货订单状态变化日志
--
create table return_order_log(
    log_id                      bigint unsigned     not null    auto_increment,
    order_status_before         char(8)             not null,
    order_status_after          char(8)             not null,
    operator_type               char(8)             not null,
    log_desc                    varchar(255),
    event_ts                    timestamp           not null,
    operator                    varchar(10)         not null,
    return_order_id             bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (log_id)
)engine=innodb default charset=utf8;



--
-- 退换货订单物流信息
--
create table return_order_logistics(
    logistics_id                bigint unsigned     not null    auto_increment,
    logistics_type              char(8)             not null,
    logistics_company_code      char(8),
    logistics_company_desc      varchar(20)         not null,
    logistics_num               varchar(50),
    logistics_amt               decimal(16,2)       not null,
    free_logistics_amt          boolean             not null,
    return_order_id             bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key(logistics_id)
)engine=innodb default charset=utf8;



--
-- 退换货订单配送信息
--
create table return_order_contact_info(
    return_order_id             bigint unsigned     not null,
    cntct_name                  varchar(20)         not null,
    cntct_mobile                varchar(20)         not null,
    cntct_country               char(8)             not null,
    cntct_state                 varchar(20)         not null,
    cntct_city                  varchar(20)         not null,
    cntct_town                  varchar(30)         not null,
    cntct_street                varchar(100),
    cntct_address               varchar(255)        not null,
    cntct_post_code             char(6),
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (return_order_id)
)engine=innodb default charset=utf8;



--
-- 退换货订单退款信息
--
create table return_order_refund_info(
    return_order_id             bigint unsigned     not null,
    submit_time                 timestamp           not null,
    refund_method               char(8)             not null,
    refund_channel              char(8)             not null,
    refund_account              varchar(100),
    refund_num                  varchar(50),
    refund_amt                  decimal(16,2)       not null,
    refund_time                 timestamp,
    refund_status               char(8)             not null,
    party_id                    bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key(return_order_id)
)engine=innodb default charset=utf8;



--
-- 退换货订单物品
--
create table return_order_commodity(
    return_order_cmmdty_id      bigint unsigned     not null    auto_increment,
    return_order_cmmdty_type    char(8)             not null,
    source_order_cmmdty_id      bigint unsigned     not null,
    cmmdty_id                   bigint unsigned     not null,
    cmmdty_name                 varchar(50)         not null,
    actual_price                decimal(16,2)       not null,
    qty                         smallint unsigned   not null,
    return_order_id             bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key (return_order_cmmdty_id)
)engine=innodb default charset=utf8;



--
-- 退换货物品清单
--
create table return_order_item_list(
    item_id                     bigint unsigned     not null    auto_increment,
    item_desc                   varchar(100)        not null,
    item_qty                    smallint unsigned   not null,
    return_order_cmmdty_id      bigint unsigned     not null,
    create_time                 timestamp           not null,
    update_time                 timestamp           not null,
    primary key(item_id)
)engine=innodb default charset=utf8;
    


--
-- 省
--
create table province(
    pro_id                      tinyint unsigned    not null    auto_increment,
    pro_name                    varchar(20)         not null,
    sort                        tinyint unsigned    not null,
    pro_remark                  varchar(30)         not null,
    primary key (pro_id)
)engine=innodb default charset=utf8;



--
-- 市
--
create table city(
    city_id                     smallint unsigned   not null    auto_increment,
    city_name                   varchar(20)         not null,
    pro_id                      tinyint unsigned    not null,
    sort                        smallint unsigned   not null,
    primary key (city_id)
)engine=innodb default charset=utf8;




--
-- 区镇
--
create table district(
    dis_id                      int unsigned        not null    auto_increment,
    dis_name                    varchar(30)         not null,
    city_id                     smallint unsigned   not null,
    primary key (dis_id)
)engine=innodb default charset=utf8;
