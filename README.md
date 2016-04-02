# Overview

A port of the game **Smiley House** to node.

Installation:

    git clone https://github.com/bschlenk/smileyhouse-server.git
    cd smileyhouse-server
    npm install
    npm start
    
# Reverse Engineering

I wrote a proxy that can be started with the following command:

    npm run proxy

I installed the official server on a virtual machine and pointed the client at the proxy and looked at the data being passed around. I think I sort of understand the protocol at this point.

The handshake is server first. As soon as the client connects, this interaction takes place:

	Server
	0A 13 00 00 00 4D 6F 6F 41 50 49 20 56 65 72 73 | .....MooAPI Vers
	69 6F 6E 20 31 2E 32 32                         | ion 1.22
	
	0C 03 00 4E 6F 75 73                            | ...Nous
	
	Client
	0C 03 00 0A 00 00 00 54 48 45 44 41 44 53 54 45 | .......THEDADSTE
	52                                              | R
	
	Server
	01 09 00 00 00 00 00 00 00 00 00 06 00 00 00 76 | ...............v
	69 70 2D 6E 75                                  | ip-nu
	
	01 00 00 00 00 00 00 00 00 00 00 19 00 00 00 20 | ...............
	31 39 32 2E 31 36 38 2E 31 2E 31 32 35 20 49 50 | 192.168.1.125 IP
	20 4C 6F 67 67 65 64 21                         |  Logged!
	
	Client
	02 02 00 1F 00 00 00 61 73 64 66 61 73 64 66 2A | .......asdfasdf*
	28 61 6C 70 68 61 29 42 75 69 6C 64 31 32 32 2A | (alpha)Build122*
	31 2A 30 36 38 34                               | 1*0684
	
	Server
	01 01 00 00 00 00 00 00 00 00 00 07 00 00 00 4E | ...............N
	6F 74 55 73 65 64                               | otUsed
	
	* Client Disconnected

I think I understand the buffers a little. Each frame is broken down into a messgae type, message size, and message. What I'm not sure of is what the server is sending after sending the verison number. It's different everytime. Could it be a timestamp, or a session number? I'll try and track  if that sequence is ever sent again in the same session.

The other frames are easy. It would look something like this:

~~~c++
struct header {
	char messageType;
	char messageOtherType;
	char unused;
	int messageSize;
	char* message;
}
~~~
    
    
---

Original game by [Pushisoft](http://www.puchisoft.com/smileyhouse.php). I take no credit for the concept or the idea.

Licensed under GPL-3.0.

