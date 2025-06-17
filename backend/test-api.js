const fetch = require('node-fetch');

const YELP_API_KEY = 'h3x9SRiBhdAEYRLhBISqxbE0vNmTLfmPcsF57gczs3_m6c0125FXex5R7FsvXJbdbBMN8E8R8VyB7Sm86GKc3zctc2PTVmmy7K1fuBzKasuxHw7L9CHm-zfwByE-aHYx';

async function testYelpAPI() {
    console.log('🧪 Testing Yelp API Key...\n');
    
    try {
        // Test with NYC coordinates
        const latitude = 40.7128;
        const longitude = -74.0060;
        const url = `https://api.yelp.com/v3/businesses/search?latitude=${latitude}&longitude=${longitude}&radius=1000&limit=5`;
        
        console.log(`📍 Searching for restaurants near NYC (${latitude}, ${longitude})`);
        console.log(`🔗 URL: ${url}\n`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${YELP_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API Error: ${errorText}`);
            return;
        }
        
        const data = await response.json();
        
        console.log(`✅ API Key is working!`);
        console.log(`📊 Found ${data.businesses?.length || 0} restaurants\n`);
        
        if (data.businesses && data.businesses.length > 0) {
            console.log('🍽️  Sample Restaurants:');
            data.businesses.slice(0, 3).forEach((business, index) => {
                console.log(`${index + 1}. ${business.name}`);
                console.log(`   ⭐ Rating: ${business.rating} (${business.review_count} reviews)`);
                console.log(`   📍 ${business.location?.address1 || 'No address'}`);
                console.log(`   💰 Price: ${business.price || 'Not specified'}`);
                console.log(`   📞 Phone: ${business.phone || 'No phone'}\n`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error testing API:', error.message);
    }
}

// Run the test
testYelpAPI(); 