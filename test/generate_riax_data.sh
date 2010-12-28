#!/bin/bash

ext3[0]=awesome_stuff
ext3[1]=more_awesom_stuff
ext3[2]=lame_stuff
ext3[3]=round_stuff
ext3[4]=square_stuff

ext6[0]=videos
ext6[1]=articles
ext6[2]=home
ext6[3]=secret_section
ext6[4]=chat

ext4[0]=view
ext4[1]=click
ext4[2]=videostart
ext4[3]=videostop
ext4[4]=videowatch

ext5[0]=button1
ext5[1]=link1
ext5[2]=logo
ext5[3]=homelink
ext5[4]=picture

modulo=4
tracking_url="http://127.0.0.1:9000/tracking_pixel.gif"

# output j tracking URLs with random query string values
for j in {0..20}
do
	#create array with 4 random integers ranged 0 through 4
	for i in {0..3}
	do
		number=$RANDOM
		let "number %= $modulo"
		rand[$i]=$number
	done
	
	e3=${ext3[${rand[0]}]}
	e4=${ext4[${rand[1]}]}
	e5=${ext5[${rand[2]}]}
	e6=${ext6[${rand[3]}]}
	command="ab -k -c 100 -n 1000 \"http://127.0.0.1:9000/tracking_pixel.gif?ext3=${e3}&ext4=${e4}&ext5=${e5}&ext6=${e6}\""
	echo $command
done
