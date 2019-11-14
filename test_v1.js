const fs = require('fs');
const mysql = require('mysql');

const config = require(__dirname + '/config');
config.ssl = {
	 ca: fs.readFileSync(config.cacert)
};

// SQL statements
const CREATE_ORDER = 'insert into orders(order_date, email) values (?, ?)';
const GET_NEW_ORDER_ID = 'select last_insert_id() as ord_id from orders';
const CREATE_ORDER_DETAILS = 'insert into order_details(description, quantity, ord_id) values ?';

const pool = mysql.createPool(config);

// Test data
const newOrder = [ new Date(), 'wilma@gmail.com' ];
const newOrderSample = [
	[ 'apple', 20 ],
	[ 'grapes', 10 ],
	[ 'orange', 30 ],
];

// Get a connection
pool.getConnection(
	(err, conn) => {
		if (err)
			throw err;
		// Start transaction
		conn.beginTransaction(
			err => {
				if (err) {
					conn.release();
					throw err;
				}
				conn.query(CREATE_ORDER, newOrder,
					(err, result) => {
						if (err) {
							conn.rollback();
							conn.release();
							throw err;
						}
						// insertId in result
						//console.info('result: ', result);
						conn.query(GET_NEW_ORDER_ID,
							(err, result) => {
								if (err) {
									conn.rollback();
									conn.release();
									throw err;
								}
								const newOrderId = result[0].ord_id;
								const newOrderDetails = newOrderSample.map(
									v => {
										v.push(newOrderId);
										return (v);
									}
								);
								conn.query(CREATE_ORDER_DETAILS, [ newOrderDetails ],
									(err, result) => {
										if (err) {
											conn.rollback();
											conn.release();
											throw err;
										}

										console.info('Committing result');
										conn.commit(
											err => {
												if (err) {
													conn.rollback();
													conn.release();
													throw err;
												}
												conn.release();
												process.exit(1);
											} // commit
										);
									} // CREATE_ORDER_DETAILS
								)
							} // GET_NEW_ORDER_ID
						)
					} // CREATE_ORDER
				); 
			} // beginTransaction
		)
	} // getConnection
)
