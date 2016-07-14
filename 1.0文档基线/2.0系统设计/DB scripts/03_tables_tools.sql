--
-- 紫耗壶商品编号序列
--
create table teapot_sequence(
    seq                         int unsigned        not null    auto_increment,
    primary key (seq)
)auto_increment = 1000500 engine=innodb default charset=utf8;



--
-- 精品商品编号序列
--
create table boutique_sequence(
    seq                         int unsigned        not null    auto_increment,
    primary key (seq)
)auto_increment = 1000500 engine=innodb default charset=utf8;



--
-- 茶叶商品编号序列
--
create table tea_sequence(
    seq                         int unsigned        not null    auto_increment,
    primary key (seq)
)auto_increment = 1000500 engine=innodb default charset=utf8;




--
-- 购物订单号序列
--
create table purchase_order_sequence(
    seq                         int unsigned        not null    auto_increment,
    primary key (seq)
)auto_increment = 10000500 engine=innodb default charset=utf8;



--
-- 退换货单号序列
--
create table return_order_sequence(
    seq                         int unsigned        not null    auto_increment,
    primary key (seq)
)auto_increment = 1000500 engine=innodb default charset=utf8;



--
-- 会员推荐码序列
--
create table recommend_sequence(
    seq                         int unsigned        not null    auto_increment,
    primary key (seq)
)auto_increment = 100100 engine=innodb default charset=utf8;
