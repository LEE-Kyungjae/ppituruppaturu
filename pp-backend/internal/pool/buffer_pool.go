package pool

import (
	"bytes"
	"sync"
)

// BufferPool provides a reusable buffer pool to reduce GC pressure
var BufferPool = sync.Pool{
	New: func() interface{} {
		return &bytes.Buffer{}
	},
}

// GetBuffer returns a buffer from the pool
func GetBuffer() *bytes.Buffer {
	return BufferPool.Get().(*bytes.Buffer)
}

// PutBuffer returns a buffer to the pool after resetting it
func PutBuffer(buf *bytes.Buffer) {
	buf.Reset()
	BufferPool.Put(buf)
}

// ByteSlicePool provides a reusable byte slice pool
var ByteSlicePool = sync.Pool{
	New: func() interface{} {
		b := make([]byte, 0, 1024) // 1KB initial capacity
		return &b
	},
}

// GetByteSlice returns a byte slice from the pool
func GetByteSlice() *[]byte {
	return ByteSlicePool.Get().(*[]byte)
}

// PutByteSlice returns a byte slice to the pool after resetting it
func PutByteSlice(b *[]byte) {
	*b = (*b)[:0] // reset length but keep capacity
	ByteSlicePool.Put(b)
}

// StringBuilderPool provides a reusable strings.Builder pool
var StringBuilderPool = sync.Pool{
	New: func() interface{} {
		return &bytes.Buffer{}
	},
}

// GetStringBuilder returns a strings.Builder from the pool
func GetStringBuilder() *bytes.Buffer {
	return StringBuilderPool.Get().(*bytes.Buffer)
}

// PutStringBuilder returns a strings.Builder to the pool after resetting it
func PutStringBuilder(sb *bytes.Buffer) {
	sb.Reset()
	StringBuilderPool.Put(sb)
}