# motu

## Python webserver (Flask)

Make sure you have Python 2.7 installed on your system

**Note**: You could also install Python 3.x, it's just that it hasn't been tested with that version yet. It should be quite simple to fix the code if you know Python.

Make sure to install [pip](https://pypi.python.org/pypi/pip/)

Installing [virtualenv](https://virtualenv.pypa.io/en/stable/) is also recommended

Assuming you've installed virtualenv as well. Now do the following:

```
mkdir YOUR_DIR

cd YOUR_DIR

virtualenv venv

git clone https://github.com/beeldengeluid/motu.git
```

In YOUR_DIR you should now have the following two directories:

- motu: containing the code of this repo
- venv: the Python virtual environment you preferrably install all the required Python libraries in

Now continue with installing the necessary Python libraries as follows:

```
. venv/bin/activate

cd motu

pip install -r requirements.txt
```

**Note**: If you skip the first command, you will simply install the Python libraries globally on your system


Now you're almost ready to start the server, the only thing to do is make sure to create a settings file:

```
cd YOUR_DIR/motu/src

cp settings-example.py settings.py
```

**Note**:

You can change the port and host of the server in the settings

To make the search functionalities of the app work, please contact me to give you a valid URL to fill in for the SEARCH_API parameter in the settings file.


Now you can test the server by running:

```
python server.py
```

If you don't get an error message, test further by going to:

```
http://localhost:5700
```

To make the app work properly, let's install the client side libraries

## Client libraries

First make sure to install [npm](https://www.npmjs.com/package/npm)

After doing so, do the following:

```
cd YOUR_DIR/motu/src/static

npm install
```

This will install the list of packages, defined in package.json, into YOUR_DIR/motu/src/static/node_modules

Now the last thing to do is to build the motu-app.js and the motu-playout.js

```
npm run build
npm run build-playout
```

After building the YOUR_DIR/src/static/dist directory is created and contains the javascript files needed to make the app work properly

