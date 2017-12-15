test:
	node tests/get-commits-for-repos-tests.js
	# node tests/get-repos-tests.js
	# node tests/get-user-commits-bounded-by-date-tests.js

test-long:
	node tests/long/get-user-commits-tests.js

test-long-sequential:
	node tests/long/get-user-commits-tests.js previous-run-repo-states.json
	node tests/long/get-user-commits-tests.js previous-run-repo-states-2.json

pushall:
	git push origin master && npm publish

prettier:
	prettier --single-quote --write "**/*.js"
